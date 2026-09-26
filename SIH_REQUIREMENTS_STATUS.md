# MARTISAN SIH requirements status

This file distinguishes working demo flows from external-service and production infrastructure requirements. “Complete” means implemented in the current web app and FastAPI demo backend; it does not imply production security or a live marketplace feed.

| Requirement | Status | Current implementation / remaining work |
| --- | --- | --- |
| Product capture, background removal, white presentation, review | Partial | Browser upload/camera picker plus local `rembg` processing and review. Product detection and catalog description use the AI service when configured; enhancement does not fabricate product details. |
| Multilingual voice catalog (Tamil, Hindi, English) | Partial | Localized question flow and an OpenAI translation endpoint exist. A valid server-side `OPENAI_API_KEY` is required for audio transcription/translation and generated speech. Device speech synthesis is only a fallback for asking questions. |
| Catalog attributes and bilingual copy | Partial | Name/category/story plus material/color/size/method/time are collected and stored. Missing facts stay blank. AI-generated text and translations need the API key. |
| Cost-based pricing range and explanation | Complete for demo | The price-suggestion button works with or without a cost: it uses a category reference when costs are blank and includes cost margin/history when entered. It fills the editable price and range. This is not live external market-price data. Tested through the browser with blank costs and ₹700 costs. |
| Product CRUD, inventory, status, search/filter | Complete for demo | Products can be created, edited, deleted, searched, and filtered; stock and Active/Draft/Out of stock status are persisted. |
| B2B discovery, buyer types, bulk enquiries, enquiry/order handling | Complete for demo | Product pages accept buyer enquiries; artisans can review, accept, decline, and convert an enquiry to an order. Inventory is decremented on conversion. |
| Seller dashboard and business assistant | Complete for demo | Dashboard aggregates inventory, new enquiries, pending orders, delivered sales, low stock, popular products, and recent activity. Assistant answers supported business queries. |
| Standard marketplace cart and order management | Complete for demo | Cart, checkout, status, seller order list, and inventory deduction are implemented. |
| Notifications | Not implemented | No push or in-app notification service yet. Enquiry and order state is visible in the app. |
| Authentication, password hashing, tokens, authorization, rate limiting | Not implemented | Current app uses switchable demo buyer/seller profiles; API routes are not protected. Do not deploy with real accounts or confidential business data until authentication and authorization are added. |
| PostgreSQL and object storage | Not implemented | Current backend uses local SQLite and stores image data with product records. Cloud database and secure object storage need deployment configuration. |
| Expo React Native / TypeScript / Expo Router | Not implemented | Current deliverable is a responsive React web application served by Vite, with FastAPI/Python backend. It can be used in VS Code and via the generated standalone root `index.html`; it is not an Expo mobile build. |
| Government marketplace integrations | Extension point only | Marketplace product and enquiry APIs are local; no GeM or procurement integration is connected. |

## Languages and technologies in this project

- Frontend: JavaScript with React and JSX, HTML, and CSS; Vite serves and builds the responsive web app. The source is not TypeScript and is not Expo React Native.
- Backend: Python with FastAPI and Uvicorn.
- Database: SQLite, accessed from Python with SQL statements (SQL is the database query language).
- AI features: OpenAI API integration is optional and needs a valid `OPENAI_API_KEY` in `backend/.env`; local image background removal uses `rembg`.

## Configuration before a live demo of AI features

Set `OPENAI_API_KEY` in `backend/.env`, then start the API with `npm run dev:all`. Background removal uses the installed local model and may download its model weights the first time it runs. Use `npm run build:static` after front-end changes to refresh root `index.html`.
