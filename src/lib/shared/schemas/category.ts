import z from "zod";

const MAX_LENGTH_NAME = 100;

export const CategorySchema = z.object({
  name: z.string({ error: "Nome é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  isGlobal: z.boolean().default(false),
  userId: z.number().optional(),
}).refine((data) => {
  // Se não é global, userId é obrigatório
  if (!data.isGlobal && !data.userId) {
    return false;
  }

  return true;
}, {
  message: "userId é obrigatório quando a categoria não é global",
  path: [ "userId" ],
});

export type CategorySchemaData = z.infer<typeof CategorySchema>;

export const CategoryUpdateSchema = CategorySchema.partial();

export type CategoryUpdateSchemaData = z.infer<typeof CategoryUpdateSchema>;
