import { pgTable, pgEnum, uuid, text, boolean, timestamp, date, real, integer } from "drizzle-orm/pg-core";

export const perfil = pgEnum("perfil", ["admin", "inspetor", "cliente"]);

// Empresa = tenant que assina o Lumar Fire
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  plano: text("plano").notNull().default("teste"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

// Toda tabela de negócio daqui pra frente deve ter empresa_id
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  perfil: perfil("perfil").notNull().default("inspetor"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const tipoExtintor = pgEnum("tipo_extintor", ["PQS", "CO2", "AGUA", "ESPUMA"]);

// Cliente = prédio/filial atendido pela empresa assinante
export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

// Local = andar/setor (futuramente com planta)
export const locais = pgTable("locais", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const extintores = pgTable("extintores", {
  id: uuid("id").primaryKey().defaultRandom(), // vira o QR Code na etapa 4
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  localId: uuid("local_id").notNull().references(() => locais.id, { onDelete: "cascade" }),
  tipo: tipoExtintor("tipo").notNull(),
  capacidade: text("capacidade").notNull(),
  numeroSerie: text("numero_serie"),
  fabricante: text("fabricante"),
  selo: text("selo"),
  ultimaRecarga: date("ultima_recarga", { mode: "string" }),
  validadeCarga: date("validade_carga", { mode: "string" }).notNull(),
  ultimoTesteHidro: date("ultimo_teste_hidro", { mode: "string" }),
  plantaX: real("planta_x"), // posição na planta, em % da largura (0–100)
  plantaY: real("planta_y"), // posição na planta, em % da altura (0–100)
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

export const mangueiras = pgTable("mangueiras", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  localId: uuid("local_id").notNull().references(() => locais.id, { onDelete: "cascade" }),
  numero: text("numero").notNull(), // identificação do hidrante/abrigo
  tipo: text("tipo").notNull(), // tipo 1 a 5 (NBR 11861)
  diametro: text("diametro").notNull(), // 1½" ou 2½"
  comprimento: text("comprimento").notNull(), // 15 m, 30 m...
  ultimoTeste: date("ultimo_teste", { mode: "string" }),
  validadeTeste: date("validade_teste", { mode: "string" }).notNull(), // teste hidrostático anual
  plantaX: real("planta_x"),
  plantaY: real("planta_y"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

// Inspeção aponta para um extintor OU uma mangueira
export const inspecoes = pgTable("inspecoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  extintorId: uuid("extintor_id").references(() => extintores.id, { onDelete: "cascade" }),
  mangueiraId: uuid("mangueira_id").references(() => mangueiras.id, { onDelete: "cascade" }),
  inspetorId: uuid("inspetor_id").references(() => usuarios.id, { onDelete: "set null" }),
  conforme: boolean("conforme").notNull(),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

// Planta baixa do local: uma imagem por local, guardada em base64 (limite de 2 MB na ação)
export const plantas = pgTable("plantas", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  localId: uuid("local_id").notNull().unique().references(() => locais.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(),
  dados: text("dados").notNull(), // base64
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

// Serviços vinculados a um equipamento, com histórico preservado.
export const manutencoes = pgTable("manutencoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  extintorId: uuid("extintor_id").references(() => extintores.id, { onDelete: "cascade" }),
  mangueiraId: uuid("mangueira_id").references(() => mangueiras.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  status: text("status").notNull().default("pendente"),
  descricao: text("descricao"),
  responsavel: text("responsavel"),
  fornecedor: text("fornecedor"),
  previsao: date("previsao", { mode: "string" }),
  conclusao: date("conclusao", { mode: "string" }),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});
