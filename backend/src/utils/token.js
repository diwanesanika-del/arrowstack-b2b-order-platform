import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'b2b_jwt_super_secret_key_arrowstack_2026_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || user.fullName,
      companyName: user.company_name || user.companyName
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
