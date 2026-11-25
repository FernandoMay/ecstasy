# Netlify functions

No custom Netlify Functions are required for ECSTASY.

The Next.js Runtime (installed automatically by Netlify) provisions the serverless function that serves App Router route handlers, including `POST /api/challenge-payment`. The directory is declared in `netlify.toml` to match the UI's "Functions directory" setting; keeping it present avoids a missing-directory warning.

Do not put Stellar secret keys or seed phrases here or in Netlify environment variables. The Mission 02 payment endpoint uses an ephemeral, friendbot-funded Testnet keypair generated per request.
