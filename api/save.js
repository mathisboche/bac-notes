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

  if (req.method === 'POST') {
    try {
      const token = req.headers['authorization']
      if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' })
      
      const decoded = jwt.verify(token, JWT_SECRET)
      await client.query(
        q.Update(
          q.Ref(q.Collection('users'), decoded.id),
          { data: { formData: req.body.formData } }
        )
      )
      
      res.status(200).json({ message: 'Form data saved successfully' })
    } catch (error) {
      res.status(500).json({ message: 'Error saving form data' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}