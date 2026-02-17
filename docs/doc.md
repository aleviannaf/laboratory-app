# doc.md - Mapa funcional da aplicacao

## Objetivo
Este documento serve como guia de manutencao e evolucao da aplicacao, mostrando:
- onde cada responsabilidade esta;
- quais arquivos compoem cada funcionalidade;
- qual padrao seguir para criar novas features sem quebrar a arquitetura.

Base usada nesta analise:
- `docs/architecture.md`
- `docs/sqlx.md`

Observacao: o arquivo citado como `architeture.md` no pedido esta no repositorio como `docs/architecture.md`.

## Arquitetura (resumo)
A aplicacao usa Angular (frontend) + Tauri/Rust (backend) + SQLite (SQLx), com separacao em camadas no backend:
- `domain`: contratos e regras puras de negocio.
- `application`: casos de uso (orquestracao).
- `infra`: SQLx, SQLite, migrations e repositorios concretos.
- `interface`: comandos IPC (`#[tauri::command]`) expostos para o frontend.
- `app`: composicao das dependencias e `AppState`.

Fluxo principal:
1. UI Angular chama `invoke`.
2. Comando IPC recebe e delega para use case.
3. Use case valida entrada e chama `port` do dominio.
4. Repositorio SQLx executa no SQLite.
5. Resultado volta ate a UI.

## Mapa por funcionalidade

### 1) Documentacao e referencias tecnicas
- `docs/architecture.md`: visao de arquitetura, separacao de camadas e fluxo da aplicacao.
- `docs/sqlx.md`: padrao de uso do SQLx, pool, migrations e repositorio SQLite.
- `docs/design-system.md`: referencia de design/estilo do frontend.
- `database.md`: documenta schema, relacoes e fluxos atuais de persistencia.
- `README.md`: setup/execucao do projeto.

### 2) Backend - bootstrap, composicao e estado global
- `src-tauri/src/main.rs`: entrypoint nativo da app Tauri no desktop.
- `src-tauri/src/lib.rs`: inicializa Tauri, resolve pasta de dados, registra comandos IPC e injeta estado.
- `src-tauri/src/app/mod.rs`: modulo agregador da camada de composicao.
- `src-tauri/src/app/compose.rs`: cria pool SQLite, roda migrations, instancia repositorio e use cases, monta `AppState`.
- `src-tauri/src/app/state.rs`: define dependencias globais compartilhadas pelos comandos IPC.
- `src-tauri/src/app/error.rs`: erro da camada de aplicacao/composicao (`Validation`, `Database`, `Unexpected`).

### 3) Backend - dominio de pacientes
- `src-tauri/src/domain/mod.rs`: agregador dos dominios.
- `src-tauri/src/domain/patients/mod.rs`: agregador do dominio `patients`.
- `src-tauri/src/domain/patients/entity.rs`: entidade `Patient` e validacoes basicas de construcao.
- `src-tauri/src/domain/patients/dto.rs`: DTOs de entrada/saida para pacientes, prontuario, catalogo e atendimento.
- `src-tauri/src/domain/patients/errors.rs`: erros do dominio e de repositorio para traducao entre camadas.
- `src-tauri/src/domain/patients/ports.rs`: contrato `PatientRepository` (abstracao usada pelos use cases).

### 4) Backend - casos de uso (application/patients)
- `src-tauri/src/application/mod.rs`: agregador da camada `application`.
- `src-tauri/src/application/patients/mod.rs`: agregador dos use cases de pacientes.
- `src-tauri/src/application/patients/create_patient.rs`: valida entrada, persiste paciente, mapeia erros e retorna `PatientView`.
- `src-tauri/src/application/patients/list_patients.rs`: lista pacientes com filtro opcional e mapeia erros.
- `src-tauri/src/application/patients/get_patient_record.rs`: valida `patient_id` e retorna prontuario consolidado.
- `src-tauri/src/application/patients/list_exam_catalog.rs`: retorna catalogo de exames via repositorio.
- `src-tauri/src/application/patients/create_attendance.rs`: valida criacao de atendimento e chama persistencia transacional.

### 5) Backend - interface IPC (fronteira com frontend)
- `src-tauri/src/interface/mod.rs`: agregador da camada de interface.
- `src-tauri/src/interface/ipc/mod.rs`: agregador dos comandos IPC.
- `src-tauri/src/interface/ipc/patients.rs`: comandos `create_patient` e `list_patients`.
- `src-tauri/src/interface/ipc/patient_records.rs`: comandos `get_patient_record`, `list_exam_catalog`, `create_attendance`.

### 6) Backend - infraestrutura SQLx/SQLite
- `src-tauri/src/infra/mod.rs`: agregador da infra.
- `src-tauri/src/infra/db/mod.rs`: agregador do modulo de banco.
- `src-tauri/src/infra/db/sqlite.rs`: criacao de pool SQLite e execucao de migrations embutidas.
- `src-tauri/src/infra/repositories/mod.rs`: agregador de repositorios concretos.
- `src-tauri/src/infra/repositories/patients_sqlite.rs`: implementacao SQLx de `PatientRepository`.
  - insert/list de pacientes
  - leitura de prontuario com joins e agrupamento
  - criacao de atendimento em transacao
  - mapeamento de erro SQLx -> erro de repositorio

### 7) Banco de dados (migrations)
- `src-tauri/src/infra/db/migrations/0001_create_users.sql`: estrutura de usuarios internos.
- `src-tauri/src/infra/db/migrations/0002_create_patients.sql`: tabela principal de pacientes.
- `src-tauri/src/infra/db/migrations/0003_create_requesters.sql`: tabela de solicitantes de exames.
- `src-tauri/src/infra/db/migrations/0004_create_exams.sql`: tabela de atendimentos/exames.
- `src-tauri/src/infra/db/migrations/0005_create_exam_items.sql`: itens de exames por atendimento.
- `src-tauri/src/infra/db/migrations/0006_create_pdf_reports.sql`: metadados de laudos PDF.
- `src-tauri/src/infra/db/migrations/0007_create_sync_runs.sql`: historico de sincronizacao.
- `src-tauri/src/infra/db/migrations/0008_create_audit_log.sql`: trilha de auditoria.
- `src-tauri/src/infra/db/migrations/0009_create_indexes.sql`: indices iniciais.
- `src-tauri/src/infra/db/migrations/0010_create_exams_patient_date_index.sql`: indice focado em prontuario por paciente/data.

### 8) Backend - testes
- `src-tauri/tests/patients_list_use_case_tests.rs`: valida comportamento do use case de listagem e traducao de erros.
- `src-tauri/tests/patients_get_record_use_case_tests.rs`: valida regra e mapeamento do use case de prontuario.
- `src-tauri/tests/patients_sqlite_list_repository_tests.rs`: integracao de repositorio SQLx para insert/list em SQLite in-memory.
- `src-tauri/tests/patients_sqlite_record_repository_tests.rs`: integracao de prontuario/criacao de atendimento/catalogo.

### 9) Frontend - raiz e roteamento
- `src/main.ts`: bootstrap Angular.
- `src/app/app.config.ts`: providers globais (router, dialog, echarts etc.).
- `src/app/app.routes.ts`: rotas principais e lazy loading das paginas.
- `src/app/app.component.ts`: componente raiz (contendo tambem codigo legado de exemplo Tauri `greet`).
- `src/app/app.component.html`: template raiz.
- `src/app/app.component.css`: estilos locais do componente raiz.
- `src/styles.css`: estilos globais da aplicacao.
- `src/index.html`: host page do Angular.

### 10) Frontend - core (servicos e design tokens)
- `src/app/core/services/patients-api.service.ts`: ponte frontend -> comandos IPC de pacientes.
- `src/app/core/services/patient-record-api.service.ts`: ponte frontend -> comandos IPC de prontuario/atendimento/catalogo.
- `src/app/core/design/design-tokens.css`: tokens visuais reutilizaveis.
- `src/app/core/design/README.md`: guia de uso dos tokens.

### 11) Frontend - layout compartilhado
- `src/app/layout/layout.component.ts`: shell principal (sidebar + topbar + outlet + toasts).
- `src/app/layout/layout.component.html`: estrutura do shell.
- `src/app/layout/layout.component.scss`: estilo do shell.
- `src/app/layout/sidebar/sidebar.component.ts`: menu lateral e navegacao.
- `src/app/layout/sidebar/sidebar.component.html`: template do menu lateral.
- `src/app/layout/sidebar/sidebar.component.scss`: estilo do menu lateral.
- `src/app/layout/topbar/topbar.component.ts`: barra superior.
- `src/app/layout/topbar/topbar.component.html`: template da topbar.
- `src/app/layout/topbar/topbar.component.scss`: estilo da topbar.

### 12) Frontend - funcionalidade Patients (listagem/cadastro/prontuario)
Arquivos de orquestracao e dados:
- `src/app/pages/patient/patient.routes.ts`: rota da feature.
- `src/app/pages/patient/patients.component.ts`: container principal da tela de pacientes (estado, filtros, dialogs, chamadas de servicos).
- `src/app/pages/patient/patients.component.html`: template da tela.
- `src/app/pages/patient/patients.component.scss`: estilo da tela.
- `src/app/pages/patient/patients.component.spec.ts`: testes da tela.
- `src/app/pages/patient/patient.service.ts`: adapta DTO da API para modelo de UI.
- `src/app/pages/patient/patient-record.service.ts`: monta/normaliza prontuario e cria atendimento a partir do catalogo.
- `src/app/pages/patient/patient-record.service.spec.ts`: testes do servico de prontuario.
- `src/app/pages/patient/new-attendance-catalog.service.ts`: busca/cacheia/agrupa catalogo de exames para o dialog.
- `src/app/pages/patient/models/patient.model.ts`: modelo de paciente da UI.
- `src/app/pages/patient/models/patient-record.model.ts`: modelos de prontuario da UI.
- `src/app/pages/patient/models/new-attendance.model.ts`: modelos do fluxo de novo atendimento.

Subcomponentes da feature Patients:
- `src/app/pages/patient/components/patients-header/patients-header.component.ts`: cabecalho da tela.
- `src/app/pages/patient/components/patients-header/patients-header.component.html`: view do cabecalho.
- `src/app/pages/patient/components/patients-header/patients-header.component.scss`: estilo do cabecalho.
- `src/app/pages/patient/components/patients-filters/patients-filters.component.ts`: filtros/busca.
- `src/app/pages/patient/components/patients-filters/patients-filters.component.html`: view dos filtros.
- `src/app/pages/patient/components/patients-filters/patients-filters.component.scss`: estilo dos filtros.
- `src/app/pages/patient/components/patients-table/patients-table.component.ts`: tabela/lista de pacientes.
- `src/app/pages/patient/components/patients-table/patients-table.component.html`: view da tabela.
- `src/app/pages/patient/components/patients-table/patients-table.component.scss`: estilo da tabela.

Dialogs de prontuario/atendimento:
- `src/app/pages/patient/components/dialogs/patient-record-dialog/patient-record-dialog.component.ts`: abre prontuario, recarrega dados e dispara fluxo de novo atendimento.
- `src/app/pages/patient/components/dialogs/patient-record-dialog/patient-record-dialog.component.html`: view do prontuario.
- `src/app/pages/patient/components/dialogs/patient-record-dialog/patient-record-dialog.component.scss`: estilo do prontuario.
- `src/app/pages/patient/components/dialogs/patient-record-dialog/patient-record-dialog.component.spec.ts`: testes do dialog de prontuario.
- `src/app/pages/patient/components/dialogs/new-attendance-dialog/new-attendance-dialog.component.ts`: cria atendimento no prontuario (seleciona exames/data e confirma).
- `src/app/pages/patient/components/dialogs/new-attendance-dialog/new-attendance-dialog.component.html`: view do dialog de novo atendimento.
- `src/app/pages/patient/components/dialogs/new-attendance-dialog/new-attendance-dialog.component.scss`: estilo do dialog.
- `src/app/pages/patient/components/dialogs/new-attendance-dialog/new-attendance-dialog.component.spec.ts`: testes do dialog.

### 13) Frontend - funcionalidade Exames (catalogo)
- `src/app/pages/exames/exames.component.ts`: container da pagina de catalogo e filtro.
- `src/app/pages/exames/exames.component.html`: view da pagina.
- `src/app/pages/exames/exames.component.scss`: estilo da pagina.
- `src/app/pages/exames/exam-catalog.service.ts`: fonte/filtragem do catalogo no frontend (dados atuais estaticos).
- `src/app/pages/exames/models/exam-catalog.model.ts`: modelos da feature.
- `src/app/pages/exames/components/exames-header/exames-header.component.ts`: cabecalho.
- `src/app/pages/exames/components/exames-header/exames-header.component.html`: view do cabecalho.
- `src/app/pages/exames/components/exames-header/exames-header.component.scss`: estilo do cabecalho.
- `src/app/pages/exames/components/exames-filters/exames-filters.component.ts`: entrada de busca.
- `src/app/pages/exames/components/exames-filters/exames-filters.component.html`: view de filtros.
- `src/app/pages/exames/components/exames-filters/exames-filters.component.scss`: estilo de filtros.
- `src/app/pages/exames/components/exames-catalog/exames-catalog.component.ts`: renderizacao das secoes/itens.
- `src/app/pages/exames/components/exames-catalog/exames-catalog.component.html`: view do catalogo.
- `src/app/pages/exames/components/exames-catalog/exames-catalog.component.scss`: estilo do catalogo.
- `src/app/pages/exames/components/exames-empty-state/exames-empty-state.component.ts`: estado vazio.
- `src/app/pages/exames/components/exames-empty-state/exames-empty-state.component.html`: view de vazio.
- `src/app/pages/exames/components/exames-empty-state/exames-empty-state.component.scss`: estilo de vazio.

### 14) Frontend - funcionalidade Atendimentos (fila)
- `src/app/pages/atendimentos/atendimentos.component.ts`: container da fila de atendimentos (aba, data, filtros, dialogs).
- `src/app/pages/atendimentos/atendimentos.component.html`: view da pagina.
- `src/app/pages/atendimentos/atendimentos.component.scss`: estilo da pagina.
- `src/app/pages/atendimentos/atendimentos.component.spec.ts`: testes da pagina.
- `src/app/pages/atendimentos/attendance-queue.service.ts`: regras de filtro/contagem/atualizacao da fila (com seed local atualmente).
- `src/app/pages/atendimentos/attendance-queue.service.spec.ts`: testes do servico.
- `src/app/pages/atendimentos/models/attendance-queue.model.ts`: tipos da fila.

Subcomponentes da fila:
- `src/app/pages/atendimentos/components/atendimentos-header/atendimentos-header.component.ts`: cabecalho.
- `src/app/pages/atendimentos/components/atendimentos-header/atendimentos-header.component.html`: view do cabecalho.
- `src/app/pages/atendimentos/components/atendimentos-header/atendimentos-header.component.scss`: estilo do cabecalho.
- `src/app/pages/atendimentos/components/atendimentos-filters/atendimentos-filters.component.ts`: filtros e pesquisa.
- `src/app/pages/atendimentos/components/atendimentos-filters/atendimentos-filters.component.html`: view de filtros.
- `src/app/pages/atendimentos/components/atendimentos-filters/atendimentos-filters.component.scss`: estilo de filtros.
- `src/app/pages/atendimentos/components/atendimentos-table/atendimentos-table.component.ts`: listagem/tabela de itens da fila.
- `src/app/pages/atendimentos/components/atendimentos-table/atendimentos-table.component.html`: view da tabela.
- `src/app/pages/atendimentos/components/atendimentos-table/atendimentos-table.component.scss`: estilo da tabela.
- `src/app/pages/atendimentos/components/atendimentos-table/atendimentos-table.component.spec.ts`: testes da tabela.
- `src/app/pages/atendimentos/components/atendimentos-empty-state/atendimentos-empty-state.component.ts`: estado vazio.
- `src/app/pages/atendimentos/components/atendimentos-empty-state/atendimentos-empty-state.component.html`: view de vazio.
- `src/app/pages/atendimentos/components/atendimentos-empty-state/atendimentos-empty-state.component.scss`: estilo de vazio.

Dialogs da fila:
- `src/app/pages/atendimentos/components/dialogs/date-filter-dialog/date-filter-dialog.component.ts`: selecao de data.
- `src/app/pages/atendimentos/components/dialogs/date-filter-dialog/date-filter-dialog.component.html`: view do dialog.
- `src/app/pages/atendimentos/components/dialogs/date-filter-dialog/date-filter-dialog.component.scss`: estilo do dialog.
- `src/app/pages/atendimentos/components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component.ts`: confirma conclusao do atendimento.
- `src/app/pages/atendimentos/components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component.html`: view do dialog.
- `src/app/pages/atendimentos/components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component.scss`: estilo do dialog.
- `src/app/pages/atendimentos/components/dialogs/attendance-details-dialog/attendance-details-dialog.component.ts`: detalhamento de atendimento.
- `src/app/pages/atendimentos/components/dialogs/attendance-details-dialog/attendance-details-dialog.component.html`: view do dialog.
- `src/app/pages/atendimentos/components/dialogs/attendance-details-dialog/attendance-details-dialog.component.scss`: estilo do dialog.
- `src/app/pages/atendimentos/components/dialogs/create-attendance-placeholder-dialog/create-attendance-placeholder-dialog.component.ts`: placeholder de criacao (fluxo ainda nao integrado).
- `src/app/pages/atendimentos/components/dialogs/create-attendance-placeholder-dialog/create-attendance-placeholder-dialog.component.html`: view do placeholder.
- `src/app/pages/atendimentos/components/dialogs/create-attendance-placeholder-dialog/create-attendance-placeholder-dialog.component.scss`: estilo do placeholder.

### 15) Frontend - dashboard e outras paginas
- `src/app/pages/dashboard/dashboard.component.ts`: container do dashboard e acao rapida de criar paciente (ainda parcial/placeholder).
- `src/app/pages/dashboard/dashboard.component.html`: view do dashboard.
- `src/app/pages/dashboard/dashboard.component.scss`: estilo do dashboard.
- `src/app/pages/dashboard/components/dashboard-header/dashboard-header.component.ts`: cabecalho do dashboard.
- `src/app/pages/dashboard/components/dashboard-header/dashboard-header.component.html`: view do cabecalho.
- `src/app/pages/dashboard/components/dashboard-header/dashboard-header.component.scss`: estilo do cabecalho.
- `src/app/pages/dashboard/components/quick-actions/quick-actions.component.ts`: bloco de acoes rapidas.
- `src/app/pages/dashboard/components/quick-actions/quick-actions.component.html`: view de acoes.
- `src/app/pages/dashboard/components/quick-actions/quick-actions.component.scss`: estilo de acoes.
- `src/app/pages/dashboard/components/weekly-flow-chart/weekly-flow-chart.component.ts`: grafico semanal.
- `src/app/pages/dashboard/components/weekly-flow-chart/weekly-flow-chart.component.html`: view do grafico.
- `src/app/pages/dashboard/components/weekly-flow-chart/weekly-flow-chart.component.scss`: estilo do grafico.
- `src/app/pages/dashboard/components/action-card/action-card.component.ts`: card reutilizavel de acao.
- `src/app/pages/dashboard/components/action-card/action-card.component.html`: view do card.
- `src/app/pages/dashboard/components/action-card/action-card.component.scss`: estilo do card.
- `src/app/pages/configuracoes/configuracoes.component.ts`: pagina de configuracoes (estrutura inicial).
- `src/app/pages/pacientes/pacientes.component.ts`: arquivo legado/paralelo ao modulo `patient` (avaliar consolidacao).

### 16) Frontend - UI compartilhada
Modal de cadastro de paciente:
- `src/app/shared/ui/modal-patient/patient-modal.service.ts`: service para abrir dialog de cadastro.
- `src/app/shared/ui/modal-patient/patient-create-dialog.component.ts`: implementacao do dialog com form validado.
- `src/app/shared/ui/modal-patient/patient-create-dialog.component.html`: view do dialog.
- `src/app/shared/ui/modal-patient/patient-create-dialog.component.scss`: estilo do dialog.
- `src/app/shared/ui/modal-patient/patient-create-dialog.types.ts`: contratos de entrada/saida do dialog.

Toast de notificacoes:
- `src/app/shared/ui/toast/toast.service.ts`: estado e API de notificacao (`success`, `error`, `info`).
- `src/app/shared/ui/toast/toast-container.component.ts`: container visual conectado ao service.
- `src/app/shared/ui/toast/toast-container.component.html`: view dos toasts.
- `src/app/shared/ui/toast/toast-container.component.scss`: estilo dos toasts.

## Padrao para novas features

### Backend (Clean Architecture)
1. Criar/modificar modelos e contratos no dominio:
- `src-tauri/src/domain/<feature>/entity.rs`
- `src-tauri/src/domain/<feature>/dto.rs`
- `src-tauri/src/domain/<feature>/errors.rs`
- `src-tauri/src/domain/<feature>/ports.rs`

2. Criar use cases em `application`:
- `src-tauri/src/application/<feature>/<use_case>.rs`
- validar entrada no use case;
- traduzir erros de repositorio para `AppError`.

3. Implementar repositorio concreto em `infra/repositories`:
- usar SQLx com binds explicitos;
- mapear `sqlx::Error` para erro de repositorio;
- usar transacao quando houver multiplos writes.

4. Expor comandos IPC em `interface/ipc`:
- comando recebe DTO;
- chama use case pelo `AppState`;
- retorna DTO/view.

5. Registrar na composicao:
- instanciar use case em `src-tauri/src/app/compose.rs`;
- incluir no `src-tauri/src/app/state.rs`;
- registrar no `invoke_handler` em `src-tauri/src/lib.rs`.

6. Persistencia:
- criar nova migration em `src-tauri/src/infra/db/migrations` (append-only);
- nunca editar migration ja aplicada em ambientes reais.

7. Testes:
- use case tests com stub de port;
- repository tests com SQLite in-memory.

### Frontend (container + servicos + componentes)
1. Core API service (`src/app/core/services`):
- adicionar metodo `invoke` para novo comando IPC;
- manter tipos DTO sincronizados com backend.

2. Service da feature (`src/app/pages/<feature>/*.service.ts`):
- mapear DTO -> modelo de UI;
- concentrar logica de transformacao e regra de apresentacao.

3. Container da pagina/dialog:
- estado, fluxos async, tratamento de erro e abertura de dialogs.

4. Componentes presentacionais:
- separar header/filtro/tabela/empty-state/dialogs;
- manter componentes pequenos e de responsabilidade unica.

5. Modelos e testes:
- criar/atualizar `models/*.model.ts`;
- atualizar specs relevantes (`*.spec.ts`).

## Onde mexer para manutencao rapida
- Criacao/listagem de pacientes backend: `src-tauri/src/application/patients/create_patient.rs`, `src-tauri/src/application/patients/list_patients.rs`, `src-tauri/src/infra/repositories/patients_sqlite.rs`.
- Prontuario e historico: `src-tauri/src/application/patients/get_patient_record.rs`, `src-tauri/src/infra/repositories/patients_sqlite.rs`, `src/app/pages/patient/patient-record.service.ts`.
- Criacao de atendimento: `src-tauri/src/application/patients/create_attendance.rs`, `src-tauri/src/interface/ipc/patient_records.rs`, `src/app/pages/patient/components/dialogs/new-attendance-dialog/new-attendance-dialog.component.ts`.
- Catalogo de exames: backend `src-tauri/src/application/patients/list_exam_catalog.rs` + `src-tauri/src/infra/repositories/patients_sqlite.rs`; frontend `src/app/pages/exames/exam-catalog.service.ts` e `src/app/pages/patient/new-attendance-catalog.service.ts`.
- Estrutura de banco: `src-tauri/src/infra/db/migrations/*.sql` e `database.md`.
- Registro de comandos e wiring: `src-tauri/src/lib.rs`, `src-tauri/src/app/compose.rs`, `src-tauri/src/app/state.rs`.
- Rotas frontend: `src/app/app.routes.ts` e `src/app/pages/patient/patient.routes.ts`.

## Pontos de atencao atuais
- `src/app/app.component.ts` ainda contem exemplo `greet` de template inicial do Tauri, aparentemente nao usado no fluxo principal.
- `src/app/pages/pacientes/pacientes.component.ts` coexistindo com `src/app/pages/patient/*` pode indicar legado/duplicidade.
- Catalogo de exames no backend esta hardcoded em `src-tauri/src/infra/repositories/patients_sqlite.rs` (ainda sem tabela dedicada).

## Atualizacao - Fila com backend real
- IPC backend de fila:
  - `src-tauri/src/interface/ipc/patient_records.rs`:
    - `list_attendance_queue`
    - `complete_attendance`
- Use cases backend de fila:
  - `src-tauri/src/application/patients/list_attendance_queue.rs`
  - `src-tauri/src/application/patients/complete_attendance.rs`
- Repositorio backend:
  - `src-tauri/src/infra/repositories/patients_sqlite.rs`:
    - listagem com filtros por data/status/busca
    - conclusao persistida (`status = completed`)
- API bridge frontend:
  - `src/app/core/services/patient-record-api.service.ts`:
    - `listAttendanceQueue`
    - `completeAttendance`
- Tela frontend:
  - `src/app/pages/atendimentos/attendance-queue.service.ts`:
    - carga remota da fila e mapeamento DTO->UI
  - `src/app/pages/atendimentos/atendimentos.component.ts`:
    - inicializacao assincrona, estado de loading/erro, conclusao persistida e recarga

## Guia recomendado para novas features

Para criar um novo modulo/funcionalidade com baixo risco de regressao, siga esta ordem:
1. `docs/feature-playbook.md` (checklist operacional e DoD)
2. `docs/architecture.md` (camadas e fluxo)
3. `docs/database.md` (impacto de dados e relacoes)
4. `docs/sqlx.md` (detalhes de persistencia SQLx)
5. `docs/design-system.md` (padrao visual no frontend)

Referencia rapida:
- Se a mudanca for de schema, comecar por migration + update de `docs/database.md`.
- Se a mudanca for de fluxo, comecar por contrato IPC + use case e depois UI.
- Toda entrega deve terminar com docs atualizados e testes relevantes.
