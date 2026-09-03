This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Financial distress model

Install the Python dependencies and train from the generated dataset:

```bash
python -m pip install -r requirements-ml.txt
python scripts/train_financial_distress.py
```

The pipeline uses customer-disjoint train, validation, and test groups with
chronological windows (months 1-6, 7-8, and 9-10). The preprocessor is fitted
on training rows only. The target is `future_sustained_distress`: whether
sustained distress occurs in the following two months. The decision threshold
is tuned on validation data to maximize recall while maintaining a 70% precision
floor, then held-out test metrics are reported once.

Generated files are written to `models/financial_distress/`:

- `xgboost_classifier.joblib` and `preprocessor.joblib`: inference artifacts.
- `metadata.json`: threshold, split sizes, feature names, metrics, and the
	confusion matrix.
- `test_predictions.csv`: held-out row predictions and probabilities.
- `feature_importance.json`: global XGBoost feature importance.
- `customer_explanations.json`: latest-row probability and top SHAP factors for
	each customer, suitable for a Next.js API response.

The model output is an early-support signal for human review. It must not be
used as an automated credit, pricing, eligibility, or punitive decision.

## API

Apply `supabase/schema.sql` to create the `financial_records` and
`interventions` tables with row-level security. Authenticated API routes are:

- `GET /api/customers/:customerId/financial-data`
- `POST /api/risk-assessment` with `{ "customerId": "..." }`
- `GET /api/interventions?customer_id=...`
- `POST /api/interventions`

The risk route runs Python model inference on the server. It requires Python
and the generated model directory at deployment time. No service-role key is
used or exposed; requests use the existing cookie-backed Supabase server
client and database RLS.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
