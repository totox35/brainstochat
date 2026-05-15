# BrainstoChat

A secure E2EE messenger featuring a collaborative whiteboard. This project focuses on cryptographic logic and real-time architecture, with the UI intentionally handled by AI.

### Project Goal
The objective is to master end-to-end encryption, Next.js deployment, and scalable backend architecture. Design is secondary; the priority is the "business logic" and data security. And have a little bit of fun implemtenting goofy things such as the whiteboard

### Security & Encryption
The app follows a **Zero-Knowledge** architecture:
* **Key Exchange:** ECDH (Elliptic Curve Diffie-Hellman) for local key derivation.
* **Encryption:** AES-GCM 256-bit for both text messages and whiteboard vectors. 
* **Privacy:** All data is encrypted client-side; the server never sees your content in clear text.

### Supabase Architecture
We leverage Supabase for two distinct communication flows:

* **Persistence (SQL):** Stores public keys and encrypted message history. This ensures asynchronous communication, allowing you to retrieve messages even after being offline.
* **Real-time (Broadcast & Presence):** Handles ephemeral data like `isTyping` status, `isOnline` indicators, and live `DrawData`. These are transmitted via WebSockets and kept in memory only