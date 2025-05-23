const AuthService = require('./auth.service');
const authSchema = require('./auth.schema');
const dbApi = require('../database/db.index');
const authenticate = require('../middleware/authenticate');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');