# Pythia — Predictive Inventory Intelligence

> Built at **Hack4Her** · Powered by **Gemini AI** · For **Arca Continental**

---

## What is Pythia?

Pythia is a predictive intelligence system that optimizes inventory decisions at distribution centers (CEDIS) and manages product substitutions before the delivery truck ever leaves the warehouse.

When a product is out of stock, traditional logistics forces drivers to arrive at a customer's door with an unexpected substitution — which often gets rejected on the spot, wasting time, fuel, and money. Pythia eliminates this problem entirely.

---

## Key Features

- **AI-powered substitution recommendations** — Predicts the best substitution options based on historical acceptance patterns per customer
- **Pre-departure notifications** — Alerts customers before the truck leaves the warehouse
- **Real-time accept/reject portal** — Customers can approve or reject substitutions from a dedicated client portal
- **Reduced logistics costs** — Fewer rejected deliveries means fewer wasted routes
- **Improved operational efficiency** — Warehouse, driver, and customer are all aligned before departure

## How AI is Used

Pythia uses the **Gemini API** as its core intelligence layer. The model analyzes:

- Historical order data from the CEDIS
- Past substitution acceptance patterns per customer
- Product category relationships and similarities

Based on this analysis, Gemini ranks and recommends the most likely-to-be-accepted substitution for each out-of-stock product, personalized per customer. The recommendation is then surfaced to the operations team and simultaneously communicated to the customer via the portal.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (supply-harmony) |
| Backend | Node.js / Python (backend) |
| Database | MongoDB |
| AI | Google Gemini API |
| Version Control | GitHub |

## Project Structure

```
Hack4Her_Athena/
├── backend/          # API, business logic, AI integration
├── supply-harmony/   # Frontend (React)
```

## Team

Built with 💜 at **Hack4Her** by **Team Athena Growth**

Distribution centers handle thousands of daily orders. When inventory falls short, substitutions are made — but without customer input, rejection rates are high. Every rejected delivery is a failed trip: wasted fuel, driver time, and customer trust.

**Pythia turns a reactive problem into a proactive solution.**
