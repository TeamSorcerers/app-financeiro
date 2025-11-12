import z from "zod";

const MAX_LENGTH_NAME = 100;

export const CategorySchema = z.object({
  name: z.string({ error: "Nome é obrigatório" }).
    min(1, "Nome não pode estar vazio").
    max(MAX_LENGTH_NAME, `Nome deve ter no máximo ${MAX_LENGTH_NAME} caracteres`).
    trim(),
  groupId: z.number({ error: "ID do grupo é obrigatório" }).int().
    positive(),
});

export type CategorySchemaData = z.infer<typeof CategorySchema>;

export const CategoryUpdateSchema = CategorySchema.partial();

export type CategoryUpdateSchemaData = z.infer<typeof CategoryUpdateSchema>;
