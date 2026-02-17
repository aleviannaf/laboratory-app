# Database.md

## Visao geral
A aplicacao usa **SQLite** com migrations SQLx (`src-tauri/src/infra/db/migrations`).
O banco foi modelado para suportar:
- cadastro de pacientes;
- solicitantes de exames (requesters);
- atendimentos/exames e seus itens;
- geracao de laudos PDF;
- trilha de auditoria;
- execucoes de sincronizacao.

IDs sao `TEXT` com valor padrao `lower(hex(randomblob(16)))`.
Campos de data/hora sao persistidos como `DATETIME` (na pratica, texto ISO no SQLite).

## Relacionamentos (alto nivel)
- `patients` 1:N `exams`
- `requesters` 1:N `exams` (opcional no exame)
- `exams` 1:N `exam_items`
- `exams` 1:1 `pdf_reports`
- `users` 1:N `pdf_reports` (quem gerou)
- `users` 1:N `audit_log` (quem executou a acao)

## Tabelas e o que cada uma recebe

### 1) `users`
Responsavel por usuarios internos do sistema.

Colunas principais:
- `id`: identificador unico.
- `name`: nome do usuario.
- `cpf`: CPF unico.
- `username`: login unico.
- `password_hash`: hash da senha.
- `role`: perfil/permissao.
- `is_active`: status do usuario.
- `created_at`, `updated_at`: controle temporal.

Recebe dados quando:
- houver fluxo de cadastro/gestao de usuarios (ainda nao implementado no fluxo principal atual de paciente).

### 2) `patients`
Tabela mestre de pacientes.

Colunas principais:
- `id`: identificador unico.
- `legacy_code`: codigo legado opcional.
- `full_name`: nome completo.
- `birth_date`: data de nascimento.
- `sex`: sexo.
- `phone`: telefone.
- `address`: endereco.
- `cpf`: unico por paciente.
- `created_at`, `updated_at`: auditoria temporal.

Recebe dados quando:
- comando `create_patient` (IPC) -> use case -> repositorio `PatientsSqliteRepository::insert`.

Leituras:
- listagem por nome/CPF em `list_patients`.
- cabecalho do prontuario em `get_patient_record`.

### 3) `requesters`
Armazena solicitantes de exames (ex.: medicos).

Colunas principais:
- `id`: identificador unico.
- `name`: nome do solicitante (unico).
- `created_at`: data de cadastro.

Recebe dados quando:
- existir fluxo de cadastro de solicitante (ainda nao implementado no frontend atual).

Leituras:
- no prontuario, para mostrar `requester_name` via `LEFT JOIN` com `exams`.

### 4) `exams`
Representa o atendimento/exame solicitado para um paciente.

Colunas principais:
- `id`: identificador unico do atendimento.
- `patient_id`: FK obrigatoria para `patients.id`.
- `requester_id`: FK opcional para `requesters.id`.
- `exam_date`: data do atendimento/exame.
- `status`: status atual (no fluxo atual inicia como `waiting`).
- `procedure_type`: tipo do procedimento (opcional).
- `delivered_to`: destinatario do resultado (opcional).
- `notes`: observacoes (opcional).
- `created_at`, `updated_at`: controle temporal.

Recebe dados quando:
- comando `create_attendance` -> `PatientsSqliteRepository::create_attendance` (insercao transacional).

Leituras:
- historico do prontuario em `get_patient_record`.

### 5) `exam_items`
Itens detalhados de cada exame/atendimento.

Colunas principais:
- `id`: identificador unico do item.
- `exam_id`: FK obrigatoria para `exams.id`.
- `name`: nome do exame/item (ex.: Glicose).
- `unit`: unidade de medida (opcional).
- `method`: metodo (opcional).
- `reference_range`: referencia (opcional).
- `result_value`: valor encontrado (opcional).
- `result_flag`: flag de resultado (opcional).
- `created_at`, `updated_at`: controle temporal.

Recebe dados quando:
- `create_attendance` grava um ou mais itens para o atendimento criado.

Leituras:
- `get_patient_record` retorna os itens agrupados por atendimento.

### 6) `pdf_reports`
Metadados do laudo PDF de um exame.

Colunas principais:
- `id`: identificador unico.
- `exam_id`: FK unica para `exams.id` (garante 1 laudo por exame nesta modelagem).
- `generated_by_user_id`: FK opcional para `users.id`.
- `generated_at`: data de geracao.
- `report_version`: versao do laudo.
- `note`: observacao do laudo.

Recebe dados quando:
- houver fluxo de geracao de laudo (nao implementado no caminho principal atual).

### 7) `sync_runs`
Historico de execucoes de sincronizacao de dados.

Colunas principais:
- `id`: identificador unico da execucao.
- `started_at`, `finished_at`: inicio/fim.
- `status`: situacao (ex.: sucesso/falha).
- `direction`: direcao da sync.
- `records_sent`, `records_received`: volumetria.
- `error_message`: erro textual opcional.

Recebe dados quando:
- for implementado processo de sincronizacao.

### 8) `audit_log`
Registro de alteracoes por entidade.

Colunas principais:
- `id`: identificador unico.
- `entity_name`: nome da entidade alterada.
- `entity_id`: ID do registro alterado.
- `action`: acao executada (insert/update/delete etc.).
- `performed_by_user_id`: FK opcional para `users.id`.
- `performed_at`: momento da acao.
- `before_json`, `after_json`: snapshot antes/depois.

Recebe dados quando:
- houver instrumentacao de auditoria nas operacoes de escrita (a estrutura existe; gravação ainda nao esta no fluxo principal atual).

## Indices
Migrations atuais criam:
- `idx_exams_patient_id` em `exams(patient_id)`
- `idx_exams_requester_id` em `exams(requester_id)`
- `idx_exam_items_exam_id` em `exam_items(exam_id)`
- `idx_audit_log_entity` em `audit_log(entity_name, entity_id)`
- `idx_audit_log_performed_at` em `audit_log(performed_at)`
- `idx_exams_patient_date` em `exams(patient_id, exam_date DESC)`

Objetivo principal:
- acelerar consultas de prontuario por paciente e ordenacao cronologica dos atendimentos.

## Interacoes atuais do sistema (implementadas)

### Fluxo: criar paciente
1. Frontend chama IPC `create_patient`.
2. Use case valida e chama repositorio.
3. Repositorio insere em `patients`.
4. Retorna `PatientView` para a UI.

Tabelas impactadas:
- escrita: `patients`
- leitura (retorno): `patients`

### Fluxo: listar pacientes
1. Frontend chama IPC `list_patients` com/sem filtro.
2. Repositorio consulta `patients` (por nome/CPF).

Tabelas impactadas:
- leitura: `patients`

### Fluxo: abrir prontuario
1. Frontend chama IPC `get_patient_record(patient_id)`.
2. Repositorio busca paciente em `patients`.
3. Repositorio busca historico em `exams` + `exam_items` + `requesters`.
4. Backend agrupa itens por exame e retorna prontuario.

Tabelas impactadas:
- leitura: `patients`, `exams`, `exam_items`, `requesters`

### Fluxo: criar atendimento
1. Frontend chama IPC `create_attendance` com paciente, data e itens.
2. Backend executa transacao:
   - insert em `exams`;
   - insert dos itens em `exam_items`.
3. Commit da transacao e retorno do atendimento criado.

Tabelas impactadas:
- escrita: `exams`, `exam_items`
- leitura auxiliar: `requesters` (quando `requester_id` e informado)

## Regras e observacoes importantes
- `cpf` de paciente e unico.
- atendimento sem itens e bloqueado no use case (`items is required`).
- `requester_id` e opcional.
- status inicial de atendimento no backend atual: `waiting`.
- catalogo de exames atual e **estatico no backend** (nao existe tabela de catalogo ainda).

## O que ainda pode evoluir
- criar tabela real para catalogo de exames (em vez de seed estatico no codigo).
- adicionar constraints de dominio (ex.: valores permitidos de `status`, `role`, `action`).
- ligar escrita de `audit_log` nas operacoes criticas.
- implementar fluxo de `pdf_reports`, `users` e `sync_runs` na aplicacao.
