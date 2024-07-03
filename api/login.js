const faunadb = require('faunadb')
const q = faunadb.query
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET })

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { username, password } = req.body
      
      const user = await client.query(
        q.Get(q.Match(q.Index('users_by_username'), username))
      )
      
      const validPassword = await bcrypt.compare(password, user.data.password)
      if (!validPassword) return res.status(401).json({ message: 'Invalid password' })

      const token = jwt.sign({ id: user.ref.id }, JWT_SECRET, { expiresIn: '24h' })
      res.status(200).json({ auth: true, token, formData: user.data.formData })
    } catch (error) {
      res.status(500).json({ message: 'Error logging in' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}