const faunadb = require('faunadb')
const q = faunadb.query
const bcrypt = require('bcrypt')
require('dotenv').config()

const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET })

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { username, password } = req.body
      const hashedPassword = await bcrypt.hash(password, 10)
      
      await client.query(
        q.Create(
          q.Collection('users'),
          { data: { username, password: hashedPassword, formData: {} } }
        )
      )
      
      res.status(201).json({ message: 'User registered successfully' })
    } catch (error) {
      res.status(500).json({ message: 'Error registering user' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}