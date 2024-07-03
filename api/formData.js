const faunadb = require('faunadb')
const q = faunadb.query
const jwt = require('jsonwebtoken')
require('dotenv').config()

const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET })
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers['authorization']
      if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' })
      
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await client.query(q.Get(q.Ref(q.Collection('users'), decoded.id)))
      
      res.status(200).json({ formData: user.data.formData })
    } catch (error) {
      res.status(500).json({ message: 'Error fetching form data' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}