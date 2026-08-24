const { dinero, add, subtract, multiply, toSnapshot } = require('dinero.js');

// Custom Bitcoin currency definition (BTC)
// Bitcoin uses 8 decimal places (satoshis)
const BTC = {
  code: 'BTC',
  base: 10,
  exponent: 8
};

// Custom Satoshi currency definition (1 satoshi = 0.00000001 BTC)
const SATS = {
  code: 'SATS',
  base: 10,
  exponent: 0
};

// Helper function to create Bitcoin amounts
function createBTC(amount, currency = BTC) {
  return dinero({ amount: Math.round(amount * Math.pow(10, currency.exponent)), currency });
}

// Helper function to format Bitcoin
function formatBTC(dineroObj) {
  const snapshot = toSnapshot(dineroObj);
  const amount = snapshot.amount / Math.pow(10, snapshot.currency.exponent);
  return `${amount} ${snapshot.currency.code}`;
}

// Helper function to format as Satoshis
function formatSatoshis(dineroObj) {
  const snapshot = toSnapshot(dineroObj);
  const amount = snapshot.amount / Math.pow(10, snapshot.currency.exponent);
  return `${amount} satoshis`;
}

// Example usage
console.log('=== Bitcoin Money Generator ===\n');

// Create some Bitcoin amounts
const btc1 = createBTC(0.5);
const btc2 = createBTC(0.25);
const btc3 = createBTC(1.0);

console.log('Created amounts:');
console.log(`BTC 1: ${formatBTC(btc1)}`);
console.log(`BTC 2: ${formatBTC(btc2)}`);
console.log(`BTC 3: ${formatBTC(btc3)}`);

// Perform operations
const sum = add(btc1, btc2);
const difference = subtract(btc3, btc2);
const product = multiply(btc2, 4);
const quotient = multiply(btc3, 0.5);

console.log('\nOperations:');
console.log(`Sum (0.5 + 0.25): ${formatBTC(sum)}`);
console.log(`Difference (1.0 - 0.25): ${formatBTC(difference)}`);
console.log(`Product (0.25 * 4): ${formatBTC(product)}`);
console.log(`Quotient (1.0 / 2): ${formatBTC(quotient)}`);

// Convert to satoshis
const satoshis1 = dinero({ 
  amount: 50000000, 
  currency: SATS 
});

console.log('\nConversions:');
console.log(`0.5 BTC = ${formatSatoshis(satoshis1)}`);

// Generate random Bitcoin amounts
function generateRandomBTC(min, max) {
  const randomAmount = Math.random() * (max - min) + min;
  return createBTC(randomAmount);
}

console.log('\nRandom Bitcoin amounts:');
for (let i = 0; i < 5; i++) {
  const randomBTC = generateRandomBTC(0.001, 10);
  console.log(`Random ${i + 1}: ${formatBTC(randomBTC)}`);
}

// Mining reward example (Bitcoin block reward)
const blockReward = createBTC(6.25);
console.log('\nMining:');
console.log(`Current Bitcoin block reward: ${formatBTC(blockReward)}`);

// Transaction example
const senderBalance = createBTC(2.5);
const transactionAmount = createBTC(0.75);
const fee = createBTC(0.0005);
const receiverAmount = subtract(transactionAmount, fee);
const newSenderBalance = subtract(senderBalance, add(transactionAmount, fee));

console.log('\nTransaction:');
console.log(`Sender balance: ${formatBTC(senderBalance)}`);
console.log(`Sending: ${formatBTC(transactionAmount)}`);
console.log(`Fee: ${formatBTC(fee)}`);
console.log(`Receiver gets: ${formatBTC(receiverAmount)}`);
console.log(`Sender new balance: ${formatBTC(newSenderBalance)}`);

// Wallet balance simulation
class BitcoinWallet {
  constructor(initialBalance = 0) {
    this.balance = createBTC(initialBalance);
  }

  deposit(amount) {
    this.balance = add(this.balance, amount);
    return this.balance;
  }

  withdraw(amount) {
    if (amount.amount > this.balance.amount) {
      throw new Error('Insufficient funds');
    }
    this.balance = subtract(this.balance, amount);
    return this.balance;
  }

  getBalance() {
    return this.balance;
  }

  formatBalance() {
    return formatBTC(this.balance);
  }
}

console.log('\nWallet Simulation:');
const wallet = new BitcoinWallet(1.0);
console.log(`Initial balance: ${wallet.formatBalance()}`);

wallet.deposit(createBTC(0.5));
console.log(`After deposit: ${wallet.formatBalance()}`);

wallet.withdraw(createBTC(0.3));
console.log(`After withdrawal: ${wallet.formatBalance()}`);

// Export for use in other modules
module.exports = {
  BTC,
  SATS,
  createBTC,
  formatBTC,
  formatSatoshis,
  generateRandomBTC,
  BitcoinWallet
};
