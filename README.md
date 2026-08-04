# Haven Homes Co.

A premium, multi-page website for a Brisbane inner-west cleaning, housekeeping and home-organising service.

## Production

- Website: https://havenhomesco.com.au
- `www` redirect: https://www.havenhomesco.com.au → https://havenhomesco.com.au
- AWS region: `ap-southeast-2`
- CloudFormation stack: `haven-homes-co-site`
- Certificate stack: `haven-homes-co-certificate` (`us-east-1`)
- CloudFront distribution: `E1JCG0WWYDI28H`

The contact form is registered as `haven-homes-co` in the Anchor Web Co. shared forms service. The production domain, `www` alias and CloudFront fallback origin are explicitly allowlisted by that service.

## Local development

```bash
npm ci
SITE_URL=http://localhost:4173 \
ANCHOR_FORMS_API_BASE=https://example.execute-api.ap-southeast-2.amazonaws.com \
npm run build
npx serve _site -l 4173
```

The site is dependency-free at runtime. `npm run build` generates the deployable `_site/` directory and `npm run check` validates the key pages, metadata, assets and contact fields.

## Deployment

GitHub Actions provisions and deploys:

- A private, encrypted, versioned S3 bucket
- A CloudFront distribution with Origin Access Control
- An ACM certificate in `us-east-1` for the apex and `www` domains
- Route 53 IPv4 and IPv6 aliases for the apex and `www` domains
- A permanent redirect from `www` and the CloudFront hostname to the canonical apex domain
- Clean URL rewriting through a CloudFront Function
- HTTPS, compression, cache invalidation and security response headers

Required GitHub Actions secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Required repository variables:

- `AWS_REGION` (defaults to `ap-southeast-2`)
- `ANCHOR_FORMS_API_BASE`

Every push to `main` provisions the certificate, hosting and DNS stacks, builds with the canonical production URL, publishes the site and invalidates the distribution.

## Contact form

The frontend submits JSON to the Anchor Web Co. shared contact API at:

`POST {ANCHOR_FORMS_API_BASE}/api/forms/haven-homes-co`

The corresponding site configuration is managed by the Anchor Web Co. infrastructure workflow.
