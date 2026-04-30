import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Prisma } from '../../prisma/generated/client';

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email.toLowerCase(), passwordHash },
        select: { id: true, email: true, createdAt: true },
      });
      return { accessToken: this.sign(user), user };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const row = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
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
      createdAt: row.createdAt,
    };
    return { accessToken: this.sign(user), user };
  }

  async validateById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, createdAt: true },
    });
  }

  private sign(user: Pick<AuthUser, 'id' | 'email'>): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
