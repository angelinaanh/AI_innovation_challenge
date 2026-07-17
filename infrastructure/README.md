# Infrastructure Module

## Purpose

Deployment, Docker, environment, and hosting configuration.

## Inputs

- Frontend build.
- Backend service.
- Supabase project settings.
- Runtime environment variables.

## Outputs

- One-command local/deployment setup where possible.
- Hosting documentation.
- Production configuration notes.

## Dependencies

- Vercel or similar frontend hosting.
- Railway/Render/Fly-style backend hosting.
- Supabase.

## Limitations

- Do not store secrets in this repository.
- Deployment must remain explainable within the hackathon demo.

