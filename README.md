# DietAI Pro

Sistema inteligente para elaboração de dietas personalizadas com apoio de Inteligência Artificial e validação profissional.

## 📋 Sobre o Projeto

O DietAI Pro é uma plataforma web desenvolvida para auxiliar nutricionistas na criação, revisão e acompanhamento de planos alimentares personalizados.

A solução utiliza Inteligência Artificial para gerar sugestões de dietas com base em informações fornecidas pelos clientes através de questionários nutricionais completos. Todas as recomendações passam obrigatoriamente pela validação de um profissional antes de serem disponibilizadas ao cliente.

O objetivo é aumentar a produtividade dos nutricionistas, melhorar o acompanhamento dos pacientes e centralizar todo o histórico alimentar em uma única plataforma.

---

## 🚀 Principais Funcionalidades

### Área do Cliente

* Cadastro e autenticação segura
* Preenchimento de questionário nutricional completo
* Visualização da dieta aprovada
* Lista de compras organizada
* Orientações nutricionais
* Check-in semanal
* Chat com assistente de IA
* Histórico alimentar

### Área do Nutricionista

* Dashboard administrativo
* Gestão de clientes
* Gestão de dietas
* Revisão e aprovação de dietas geradas por IA
* Histórico de alterações
* Acompanhamento de check-ins
* Monitoramento de clientes ativos
* Indicadores operacionais

### Inteligência Artificial

* Geração automática de dietas personalizadas
* Sugestão de refeições
* Organização de lista de compras
* Assistente conversacional
* Utilização de histórico do cliente como contexto
* Regras de segurança para evitar diagnósticos e prescrições inadequadas

---

## 🏗 Arquitetura

### Frontend

* React
* TypeScript
* Tailwind CSS
* Shadcn UI
* Responsivo para desktop, tablet e mobile

### Backend

* Lovable Cloud
* Edge Functions
* API Serverless

### Banco de Dados

* PostgreSQL
* Row Level Security (RLS)
* Políticas de acesso por perfil

### Inteligência Artificial

* Google Gemini API

---

## 👥 Perfis de Usuário

### Cliente

Pode:

* Responder questionários
* Consultar dietas aprovadas
* Realizar check-ins
* Utilizar o assistente de IA
* Visualizar histórico

### Nutricionista

Pode:

* Gerenciar clientes
* Gerar dietas com IA
* Revisar dietas
* Aprovar ou reprovar sugestões
* Acompanhar métricas
* Visualizar histórico completo

### Administrador

Possui acesso total ao sistema.

---

## 🔐 Segurança

O sistema implementa:

* Autenticação de usuários
* Controle de acesso baseado em papéis (RBAC)
* Row Level Security (RLS)
* Isolamento de dados por usuário
* Logs de auditoria
* Validação de permissões no backend
* Proteção contra acesso indevido a informações sensíveis

---

## 📊 Estrutura Atual do Banco

### profiles

Armazena informações dos usuários.

### user_roles

Controle de permissões:

* admin
* nutricionista
* cliente

### questionnaires

Questionários nutricionais preenchidos pelos clientes.

### diets

Dietas geradas pela IA e revisadas pelo profissional.

Status:

* Aguardando Revisão
* Aprovada
* Reprovada

### check_ins

Acompanhamento semanal dos clientes.

### chat_messages

Histórico de conversas do assistente de IA.

---

## 🤖 Fluxo de Geração da Dieta

1. Cliente realiza cadastro
2. Cliente preenche questionário nutricional
3. Nutricionista solicita geração da dieta
4. IA gera proposta alimentar
5. Dieta é salva como "Aguardando Revisão"
6. Nutricionista revisa e ajusta
7. Dieta é aprovada
8. Cliente visualiza o plano alimentar
9. Cliente realiza check-ins semanais
10. Histórico alimenta futuras gerações

---

## 📌 Funcionalidades MVP

✅ Cadastro e login

✅ Controle de perfis

✅ Dashboard nutricionista

✅ Cadastro de clientes

✅ Questionário nutricional

✅ Geração de dieta com IA

✅ Revisão profissional

✅ Aprovação de dietas

✅ Área do cliente

✅ Check-in semanal

✅ Chat com IA

✅ Histórico alimentar

✅ Responsividade completa

---

## 🔄 Próximas Evoluções

### Fase 2

* Geração automática de PDF
* Download de dietas em PDF
* Banco de alimentos TACO
* Dashboard avançado
* Relatórios nutricionais

### Fase 3

* Integração SMTP
* Notificações automáticas
* Recuperação de senha
* Alertas de revisão pendente

### Fase 4

* Integração WhatsApp Business
* Agendamento de consultas
* Aplicativo mobile
* API pública

---

## ⚠️ Aviso Importante

O DietAI Pro não substitui a atuação profissional de nutricionistas.

Toda dieta gerada pela Inteligência Artificial deve ser revisada e aprovada por um profissional habilitado antes de sua utilização.

A plataforma não realiza diagnósticos médicos, prescrições de medicamentos ou tratamentos clínicos.

---

## 👨‍💻 Desenvolvido por

Rodrigo Colares

