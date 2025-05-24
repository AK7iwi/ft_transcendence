const AuthService = require('./auth.service');
const authSchema = require('./auth.schema');
const authenticate = require('../security/jwt');
const securityMiddleware = require('../security/sanityze');
const dbApi = require('../database/db.index');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');


