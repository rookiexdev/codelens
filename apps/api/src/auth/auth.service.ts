import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsernameGenerator } from '../users/username';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Prisma } from '../../prisma/generated/client';
import { USER_NOT_DELETED_FILTER } from '../common/soft-delete/filters';

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

const BCRYPT_ROUNDS = 12;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function isObjectId(value: string): boolean {
  return OBJECT_ID_RE.test(value);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly username: UsernameGenerator,
    private readonly activity: ActivityService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    const email = dto.email.toLowerCase();
    const username = await this.username.fromEmail(email);

    try {
      const user = await this.prisma.user.create({
        data: { email, username, passwordHash },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
      // Fire-and-forget activity record. Failure here must not break registration.
      await this.activity.record({
        userId: user.id,
        type: 'user_registered',
      });
      return { accessToken: this.sign(user), user };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // P2002 may fire on email or username. Email is the user-meaningful
        // signal here; username collisions are extremely unlikely after the
        // generator's collision retries, so we treat both as "email taken".
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    // Filter soft-deleted accounts: a tombstoned email won't match dto.email
    // anyway (it has the #deleted-<id> suffix), but the explicit
    // not-deleted filter is kept as a defense-in-depth invariant.
    const row = await this.prisma.user.findFirst({
      where: { email, ...USER_NOT_DELETED_FILTER },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        createdAt: true,
      },
    });
    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await compare(dto.password, row.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user: AuthUser = {
      id: row.id,
      email: row.email,
      username: row.username,
      createdAt: row.createdAt,
    };
    await this.activity.record({
      userId: user.id,
      type: 'user_logged_in',
    });
    return { accessToken: this.sign(user), user };
  }

  async verifyPassword(userId: string, password: string): Promise<void> {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, ...USER_NOT_DELETED_FILTER },
      select: { passwordHash: true },
    });
    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await compare(password, row.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateById(id: string): Promise<AuthUser | null> {
    // JWTs issued before the Mongo migration carry Postgres UUIDs that
    // Mongo cannot parse as ObjectIds. Treat any malformed id as "not found"
    // so the strategy returns 401 instead of bubbling a 500.
    if (!isObjectId(id)) {
      return null;
    }
    const row = await this.prisma.user.findFirst({
      where: { id, ...USER_NOT_DELETED_FILTER },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
    return row;
  }

  private sign(user: Pick<AuthUser, 'id' | 'email'>): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
