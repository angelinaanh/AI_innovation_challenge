# CODING_RULES.md

# Mission

Write production-quality hackathon code.

Readable > Clever

Maintainable > Fancy

Shipping > Perfection

---

# Architecture

Use Clean Architecture.

Separate

UI

Business Logic

AI

Infrastructure

Database

Utilities

Never mix concerns.

---

# Naming

Meaningful names.

No abbreviations.

Avoid

data1

tmp

abc

Prefer

customerRepository

generateSummary

workflowExecutor

---

# Functions

Small

Single responsibility

Pure whenever possible.

Maximum

50 lines

---

# Files

One responsibility per file.

Prefer many small files.

---

# Error Handling

Never ignore exceptions.

Return useful errors.

Log failures.

Show user-friendly messages.

---

# Logging

Log

Errors

AI requests

Tool calls

Workflow state

Performance

---

# API

RESTful

Typed

Validated

Documented

Consistent naming.

---

# AI Layer

Separate prompts from code.

Never hardcode prompts inside business logic.

Store prompts independently.

---

# Prompt Engineering

Every prompt should have

Goal

Constraints

Output format

Examples

Failure cases

---

# Database

Normalize.

Avoid duplicated data.

Use indexes.

Soft delete when appropriate.

---

# Frontend

Minimal

Responsive

Accessible

Fast

Modern

Clear loading states

Clear error states

---

# Code Quality

Always

Lint

Format

Type check

Review

---

# Git

Small commits.

Meaningful messages.

Feature branches.

Pull requests.

---

# Documentation

Every module includes

Purpose

Inputs

Outputs

Dependencies

Limitations

---

# Testing

Critical workflows only.

Test

Authentication

AI pipeline

Database

API

Deployment

---

# Security

Never expose secrets.

Validate input.

Escape output.

Protect API keys.

Use environment variables.

---

# Deployment

One-command deployment whenever possible.

Docker preferred.

README always updated.

---

# Final Rule

Before writing code ask

Can another teammate understand this in 30 seconds?

If not

Rewrite.