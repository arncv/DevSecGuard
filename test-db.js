const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns').promises;
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Force TLS 1.2
process.env.NODE_TLS_MIN_VERSION = 'TLSv1.2';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  directConnection: false,
  retryWrites: true
};

async function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (resp) => {
      let data = '';
      resp.on('data', (chunk) => data += chunk);
      resp.on('end', () => {
        try {
          resolve(JSON.parse(data).ip);
        } catch (e) {
          reject(new Error('Failed to parse IP response'));
        }
      });
    }).on('error', reject);
  });
}

async function testDNS(hostname) {
  const results = { srv: [], cname: [], a: [] };
  
  try {
    results.srv = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);
    console.log('   ✓ SRV records found:', JSON.stringify(results.srv, null, 2));
  } catch (e) {
    console.log('   ✗ No SRV records found');
  }

  try {
    results.cname = await dns.resolveCname(hostname);
    console.log('   ✓ CNAME records found:', results.cname);
  } catch (e) {
    console.log('   - No CNAME records found (this is normal)');
  }

  try {
    results.a = await dns.resolve4(hostname);
    console.log('   ✓ A records found:', results.a);
  } catch (e) {
    console.log('   - No A records found (this is normal with SRV records)');
  }

  return results;
}

async function testConnection() {
  let client;
  let publicIP;
  
  console.log('MongoDB Connection Diagnostics');
  console.log('----------------------------');
  
  try {
    // Check public IP
    console.log('1. Checking your public IP...');
    publicIP = await getPublicIP();
    console.log(`   Your public IP: ${publicIP}`);
    console.log('   ⚠️  Please ensure this IP is whitelisted in MongoDB Atlas');

    // Test DNS resolution
    console.log('\n2. Testing DNS resolution...');
    const hostname = 'cluster0.osfks.mongodb.net';
    const dnsResults = await testDNS(hostname);
    
    if (!dnsResults.srv.length) {
      throw new Error('No MongoDB SRV records found - DNS resolution failed');
    }
    
    console.log('\n3. Creating MongoDB client...');
    client = new MongoClient(process.env.MONGODB_URI, options);

    console.log('4. Attempting to connect...');
    await client.connect();
    console.log('5. Successfully connected to MongoDB Atlas');
    
    console.log('6. Testing database operations...');
    const db = client.db('devsecguard');
    const collections = await db.listCollections().toArray();
    console.log('7. Available collections:', collections.map(c => c.name));
    
    console.log('\n✓ All tests passed successfully');
  } catch (err) {
    console.error('\n❌ Error occurred:');
    if (err.name === 'MongoServerSelectionError') {
      console.error(`Could not connect to MongoDB server. Your IP: ${publicIP}`);
      console.error('\nPossible causes:');
      console.error(`1. IP not whitelisted: Add ${publicIP} to MongoDB Atlas Network Access`);
      console.error('2. SSL/TLS certificate issues with your system');
      console.error('3. Network firewall blocking MongoDB connections');
      console.error('\nDetailed error:', err.message);
    } else {
      console.error('Error:', err.message);
      if (err.stack) {
        console.error('\nStack trace:', err.stack);
      }
    }
  } finally {
    if (client) {
      console.log('\nClosing connection...');
      await client.close();
    }
  }
}

console.log('Starting MongoDB connection diagnostics...\n');
testConnection().catch(console.error).finally(() => process.exit(0));