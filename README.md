# Bitcoin Money Generator with Dinero.js

A Bitcoin money generator and calculator using [Dinero.js](https://www.dinerojs.com/) for precise monetary operations.

## Features

- Create Bitcoin amounts with precise decimal handling
- Perform arithmetic operations (add, subtract, multiply, divide)
- Convert between BTC and satoshis
- Wallet simulation with deposit/withdraw functionality
- Generate random Bitcoin amounts
- Type-safe monetary calculations

## Installation

```bash
npm install
```

## Usage

### Run the Bitcoin generator

```bash
npm start
```

Or run the comprehensive example:

```bash
npm run bitcoin
```

### Use in your code

```javascript
const { createBTC, formatBTC, BitcoinWallet, generateRandomBTC, BTC, SATS } = require('./bitcoin');

// Create Bitcoin amounts
const btcAmount = createBTC(0.5); // 0.5 BTC
console.log(formatBTC(btcAmount)); // "0.5 BTC"

// Create a wallet
const wallet = new BitcoinWallet(1.0); // Start with 1 BTC
console.log(wallet.formatBalance()); // "1 BTC"

// Deposit and withdraw
wallet.deposit(createBTC(0.5));
wallet.withdraw(createBTC(0.2));
console.log(wallet.formatBalance()); // "1.3 BTC"

// Generate random Bitcoin
const randomBTC = generateRandomBTC(0.001, 0.1);
console.log(formatBTC(randomBTC));
```

## API

### Functions

- `createBTC(amount, currency)` - Create a Bitcoin Dinero object
- `formatBTC(dineroObj)` - Format as BTC string
- `formatSatoshis(dineroObj)` - Format as satoshis
- `generateRandomBTC(min, max)` - Generate random Bitcoin amount

### Classes

- `BitcoinWallet` - Wallet with deposit/withdraw functionality
  - `new BitcoinWallet(initialBalance)` - Create wallet
  - `deposit(amount)` - Add funds
  - `withdraw(amount)` - Remove funds
  - `getBalance()` - Get current balance
  - `formatBalance()` - Get formatted balance

### Constants

- `BTC` - Bitcoin currency object (8 decimal places)
- `SATS` - Satoshi currency object (0 decimal places)

## Examples

### Basic Operations

```javascript
const { dinero, add, subtract, multiply, divide } = require('dinero.js');
const { BTC, createBTC, formatBTC } = require('./bitcoin');

const a = createBTC(0.5);
const b = createBTC(0.25);

const sum = add(a, b);
console.log(formatBTC(sum)); // "0.75 BTC"
```

### Mining Reward

```javascript
const blockReward = createBTC(6.25);
console.log(`Current block reward: ${formatBTC(blockReward)}`);
```

### Transaction

```javascript
const senderBalance = createBTC(1.0);
const amount = createBTC(0.5);
const fee = createBTC(0.0005);

const newBalance = subtract(subtract(senderBalance, amount), fee);
console.log(`After transaction: ${formatBTC(newBalance)}`);
```

## Custom Currencies

The library defines custom Bitcoin currencies:

- **BTC**: Uses 8 decimal places (standard Bitcoin)
- **SATS**: Uses 0 decimal places (whole satoshis)

## License

Apache 2.0

## Dinero.js

This project uses [Dinero.js](https://www.dinerojs.com/), an immutable library for expressing monetary values in JavaScript and TypeScript.

- Handles money as integers in minor units to avoid floating-point precision issues
- Immutable and chainable API
- Built-in currency support
- Global settings support
- Extended formatting and rounding options
