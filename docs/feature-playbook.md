# Feature Playbook

## Objetivo
Este playbook define o padrao oficial para criar novas funcionalidades/modulos neste projeto.
Use este arquivo como checklist operacional de ponta a ponta.

Leitura complementar:
- `docs/architecture.md`
- `docs/sqlx.md`
- `docs/database.md`
- `docs/design-system.md`
- `docs/doc.md`

## Sequencia recomendada (resumo)
1. Definir escopo e contratos (entrada/saida/erros).
2. Definir impacto no banco e criar migration append-only.
3. Implementar backend por camadas (domain -> application -> infra -> interface -> composicao).
4. Implementar frontend (api bridge -> service de feature -> container -> componentes).
5. Cobrir com testes de use case, repositorio e UI/service.
6. Validar comportamento manual e atualizar documentacao.

## Checklist de implementacao

### 1) Analise de escopo
- [ ] Definir regra de negocio da feature.
- [ ] Definir comandos/acoes que a UI precisa executar.
- [ ] Definir formato de retorno esperado na UI.
- [ ] Definir erros esperados para cada fluxo.

### 2) Banco de dados (quando houver persistencia)
- [ ] Criar nova migration em `src-tauri/src/infra/db/migrations`.
- [ ] Nao editar migrations antigas ja aplicadas.
- [ ] Garantir indices para consultas novas relevantes.
- [ ] Atualizar `docs/database.md` com tabela/campos/fluxos.

### 3) Backend - Domain
Criar pasta/modulo em `src-tauri/src/domain/<feature>/`:
- [ ] `entity.rs` com regras de construcao/validacao.
- [ ] `dto.rs` com structs de entrada/saida.
- [ ] `errors.rs` com erros de dominio/repositorio.
- [ ] `ports.rs` com traits de repositorio.
- [ ] `mod.rs` exportando os submodulos.
- [ ] Atualizar `src-tauri/src/domain/mod.rs`.

Regra: dominio nao conhece SQLx, Tauri, ou detalhes de framework.

### 4) Backend - Application
Em `src-tauri/src/application/<feature>/`:
- [ ] Criar use cases (um arquivo por caso de uso).
- [ ] Validar entradas no use case.
- [ ] Chamar apenas ports do dominio.
- [ ] Traduzir erros de repositorio para `AppError`.
- [ ] Atualizar `src-tauri/src/application/mod.rs` e `mod.rs` da feature.

### 5) Backend - Infrastructure
Em `src-tauri/src/infra/repositories/`:
- [ ] Implementar repositorio concreto com SQLx.
- [ ] Usar binds explicitos (`?1`, `?2`, ... + `.bind(...)`).
- [ ] Mapear `sqlx::Error` para erro de repositorio.
- [ ] Usar transacao quando houver multiplos writes.
- [ ] Atualizar `src-tauri/src/infra/repositories/mod.rs`.

### 6) Backend - Interface IPC
Em `src-tauri/src/interface/ipc/`:
- [ ] Criar comando(s) `#[tauri::command]`.
- [ ] Receber DTO de entrada.
- [ ] Delegar para use case via `AppState`.
- [ ] Traduzir erro para string de fronteira IPC.
- [ ] Atualizar `src-tauri/src/interface/ipc/mod.rs`.

### 7) Composicao
- [ ] Instanciar repositorio/use case em `src-tauri/src/app/compose.rs`.
- [ ] Adicionar dependencias no `src-tauri/src/app/state.rs`.
- [ ] Registrar comando em `src-tauri/src/lib.rs` (`invoke_handler`).

### 8) Frontend
- [ ] Adicionar chamadas IPC em `src/app/core/services/*-api.service.ts`.
- [ ] Criar/atualizar service da feature em `src/app/pages/<feature>/`.
- [ ] Criar modelos em `src/app/pages/<feature>/models`.
- [ ] Implementar container da tela/dialog com estado e fluxos async.
- [ ] Implementar componentes presentacionais (header, filtros, tabela/cards, empty-state).
- [ ] Configurar rota em `src/app/app.routes.ts` (ou `*.routes.ts` da feature).

### 9) Design/UI
- [ ] Reusar tokens de `src/app/core/design/design-tokens.css`.
- [ ] Evitar valores hardcoded repetidos em SCSS.
- [ ] Se novo token virar padrao, atualizar `docs/design-system.md`.

### 10) Testes
Backend:
- [ ] Testes de use case (stub de port) em `src-tauri/tests`.
- [ ] Testes de repositorio SQLx com `sqlite::memory:`.

Frontend:
- [ ] Testes de services e componentes impactados (`*.spec.ts`).

### 11) Documentacao final
- [ ] Atualizar `docs/doc.md` com novos arquivos/responsabilidades.
- [ ] Atualizar `docs/database.md` se schema mudou.
- [ ] Atualizar `docs/architecture.md` se houve mudanca de padrao.

## Definition of Done (DoD)
Uma feature e considerada pronta quando:
- [ ] Fluxo funcional completo (backend + frontend).
- [ ] Migrations novas aplicam sem quebrar base existente.
- [ ] Erros esperados estao tratados na UI e no backend.
- [ ] Testes relevantes adicionados/ajustados e passando localmente.
- [ ] Documentacao atualizada (`docs/doc.md`, `docs/database.md`, etc.).
- [ ] Sem codigo placeholder/seed temporario no caminho principal (ou explicitamente documentado).

## Convencoes de nomes

### Backend
- Modulo/feature: `snake_case` (`patient_records`, `exam_catalog`).
- Arquivo de use case: verbo + alvo (`create_patient.rs`, `list_patients.rs`).
- Comando IPC: `snake_case` alinhado ao use case (`create_patient`).
- DTO de entrada: `CreateXInput` / `UpdateXInput`.
- DTO de saida: `XView`.

### Frontend
- Pasta de feature em `src/app/pages/<feature>`.
- Container com nome da feature (`patients.component.ts`).
- Service da feature com sufixo `.service.ts`.
- Models em `models/*.model.ts`.
- API bridge em `src/app/core/services/*-api.service.ts`.

## Template de contrato IPC
Use este padrao para novos comandos:

- Command name: `create_<entity>` / `list_<entity>` / `get_<entity>_by_id`
- Input DTO (Rust/TS): campos obrigatorios + opcionais claros
- Output DTO: apenas dados que a UI realmente consome
- Erros esperados:
  - `Validation("...")` para erro de entrada
  - `Database("...")` para erro de persistencia
  - mensagem de conflito explicita quando houver unique constraint

Exemplo de especificacao minima:
- Command: `create_requester`
- Input: `{ name: string }`
- Output: `{ id: string, name: string, created_at: string }`
- Erros:
  - `name is required`
  - `conflict while saving requester`

## Estrategia de migration e rollout
1. Criar arquivo numerado novo (`00xx_<acao>.sql`).
2. Incluir somente mudancas incrementais.
3. Evitar `DROP` destrutivo; preferir evolucao compativel.
4. Garantir defaults/nullable para transicao gradual quando necessario.
5. Validar em banco limpo e em banco ja migrado.

## Matriz de testes recomendada
- Regra de negocio: teste unitario de use case.
- Consulta SQL com join/filtro: teste de repositorio.
- Fluxo IPC->UI critico: teste de service frontend + teste de componente container.
- Conversoes DTO->UI model: teste dedicado do mapper quando existir regra.

## Decisoes pendentes do projeto (importante)
Antes de novos modulos grandes, alinhar:
- Catalogo de exames permanece hardcoded ou vira tabela dedicada?
- Fila de atendimentos (`atendimentos`) vai integrar 100% com backend agora ou depois?
- `pages/pacientes` sera removido/consolidado com `pages/patient`?

Registrar a decisao no PR e atualizar `docs/doc.md` apos definicao.
