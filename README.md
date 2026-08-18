# QuinileaGUE - La Liga 2026/27 Quiniela App

## Project Structure

```
quinileague/
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── utils/              # Utilities (API, constants)
│   └── context/            # React contexts
├── functions/              # AWS Lambda Backend
│   ├── src/
│   │   ├── handlers/       # Lambda handlers
│   │   └── services/       # DB models and services
│   └── serverless.yml      # Serverless Framework config
└── docs/                   # Documentation
```

## Setup

### Frontend

```bash
npm install
npm run dev
```

### Backend (Local)

```bash
cd functions
npm install
serverless offline
```

### Environment Variables

**Frontend (.env)**
```
VITE_COGNITO_USER_POOL_ID=eu-west-3_PUKVdXmsk
VITE_COGNITO_CLIENT_ID=5cjeur7sgn2rnstlr9rhoocigp
VITE_API_URL=https://ykybklpdhd.execute-api.eu-west-3.amazonaws.com
```

**Backend (.env)**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quinileague
FOOTBALL_DATA_TOKEN=your_football_data_token_here
```

## External APIs

### football-data.org
API token: `YOUR_API_TOKEN_HERE`
- Used for fetching La Liga match fixtures and results
- Competitions available: La Liga EA Sports (ID: PD)
- Free tier: 100 requests/day
- Docs: https://www.football-data.org/documentation/quickstart

## AWS Infrastructure

Deployed manually with AWS CLI (2026-08-18):

| Resource | ID/Name |
|----------|---------|
| Cognito User Pool | eu-west-3_PUKVdXmsk |
| Cognito App Client | 5cjeur7sgn2rnstlr9rhoocigp |
| API Gateway | QuinileaGUE-API (ykybklpdhd) |
| IAM Role | QuinileaGUE-LambdaRole |
| Lambda Functions | quinileague-getMatches, quinileague-getNextMatchday, quinileague-getBets, quinileague-createBet, quinileague-createResults, quinileague-getResults, quinileague-getStandings |

**API Endpoint:** `https://ykybklpdhd.execute-api.eu-west-3.amazonaws.com`

## CI/CD with GitHub Actions

Every push to `main` in the `functions/` directory automatically deploys to AWS Lambda.

### Setup

1. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `AWS_ACCESS_KEY_ID` - Access key with Lambda permissions
   - `AWS_SECRET_ACCESS_KEY` - Secret access key

2. **IAM Policy for CI/CD** (create separate user):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "lambda:UpdateFunctionCode",
      "lambda:ListFunctions"
    ],
    "Resource": "arn:aws:lambda:eu-west-3:058264417430:function:quinileague-*"
  }]
}
```

3. **Push changes** to `main` branch in `functions/` folder

### Manual Deploy

Go to **Actions** tab → **Deploy to AWS Lambda** → **Run workflow**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /matches?matchday=X | Get matches for a matchday |
| GET | /matches/next | Get next matchday with deadline |
| GET | /bets?matchday=X | Get bets for a matchday |
| POST | /bets | Create/update bet |
| POST | /results | Submit match results (admin) |
| GET | /results | Get all results |
| GET | /standings | Get user standings |

## Features

- [x] User authentication via AWS Cognito
- [x] Match prediction (1/X/2)
- [x] Deadline enforcement (blocks betting after first match starts)
- [x] Results entry (admin)
- [x] Points calculation
- [x] Standings/classification

## TODO

- [x] Seed script for matchdays (scripts/seed.js)
- [ ] Admin page for results entry
- [ ] Integrate football-data.org API for automatic results
- [ ] Email notifications
- [ ] Historical stats
