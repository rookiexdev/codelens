import {
  ArrayMaxSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateTechStackDto {
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  // Allow letters/digits/space/. + # - / so we cover names like
  // "C++", "C#", ".NET", "Node.js", "Tailwind CSS", "PostgreSQL".
  @Matches(/^[A-Za-z0-9 .+#\-/]+$/, {
    each: true,
    message: 'Each tech name must use letters, digits, spaces, or . + # - /',
  })
  techStack!: string[];
}
