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

  const path = req.url.split('/')[1]

  switch (path) {
    case 'register':
      return handleRegister(req, res)
    case 'login':
      return handleLogin(req, res)
    case 'formData':
      return handleFormData(req, res)
    case 'save':
      return handleSave(req, res)
    default:
      return res.status(404).send('Not found')
  }
}

async function handleRegister(req, res) {
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
}

async function handleLogin(req, res) {
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
}

async function handleFormData(req, res) {
  try {
    const token = req.headers['authorization']
    if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await client.query(q.Get(q.Ref(q.Collection('users'), decoded.id)))
    
    res.status(200).json({ formData: user.data.formData })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form data' })
  }
}

async function handleSave(req, res) {
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
}