#!/usr/bin/env node
/**
 * FixIt — CampusOS Backend Server
 * Complete reference implementation of the CampusOS and FixIt backend specifications.
 * Pure Node.js (zero external dependencies) with CORS, authentication, and full CRUD.
 *
 * Runs on: http://localhost:8000
 * Base API: /api/v1
 */

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = process.env.PORT || 8000;

// In-Memory Database (Pre-seeded with realistic data)
const db = {
  issueTypes: [
    {
      id: 'it_plumbing',
      name: 'Plumbing & Water Supply',
      description: 'Pipes, faucets, restroom fixtures, water coolers, drainage, and leakage repairs.',
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'it_electrical',
      name: 'Electrical & Power',
      description: 'Lighting, switchboards, circuit breakers, power outlets, and wiring faults.',
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'it_hvac',
      name: 'HVAC & Climate Control',
      description: 'Air conditioners, ventilation fans, chillers, and heating systems.',
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'it_carpentry',
      name: 'Carpentry & Furniture',
      description: 'Doors, windows, desks, chairs, locks, cupboards, and partition repairs.',
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'it_civil',
      name: 'Civil & Infrastructure',
      description: 'Masonry, flooring, ceiling tiles, roof maintenance, and structural repairs.',
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],

  tickets: [
    {
      id: 'tkt_01a9b8',
      title: 'Water leakage from ceiling in Main Library Room 204',
      description: 'Severe water seepage from overhead pipe joints in the quiet reading hall of 2nd floor library near aisle 12. Poses immediate risk to archival book stacks.',
      issue_type_id: 'it_plumbing',
      status: 'open',
      photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      expected_by: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[0],
      overdue: false,
      maintenance_note: 'Technician dispatched with pipe isolation clamp. Pressure testing in progress.',
      reporter_id: 'student@campus.edu',
      reporter_name: 'Aarav Sharma',
      reporter_email: 'student@campus.edu',
    },
    {
      id: 'tkt_02b8c7',
      title: 'Podium AC socket sparking in Seminar Hall 3',
      description: 'The main three-phase 16A wall outlet adjacent to the speaker podium sparked and tripped the secondary circuit breaker when connecting the AV rack.',
      issue_type_id: 'it_electrical',
      status: 'open',
      photo_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      expected_by: new Date(Date.now() - 12 * 3600000).toISOString().split('T')[0],
      overdue: true,
      maintenance_note: 'Awaiting replacement 16A modular receptacle from central warehouse.',
      reporter_id: 'faculty@campus.edu',
      reporter_name: 'Dr. K. Raman',
      reporter_email: 'faculty@campus.edu',
    },
    {
      id: 'tkt_03c7d6',
      title: 'Broken window latch causing rain draft in Computer Lab 4',
      description: 'South-facing heavy glass window latch is sheared off. Monsoon wind and moisture blowing directly onto server terminal workstations.',
      issue_type_id: 'it_carpentry',
      status: 'resolved',
      photo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
      resolved_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      expected_by: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
      overdue: false,
      maintenance_note: 'Installed new heavy-duty brass sash lock and weatherstripping gasket. Tested and verified airtight.',
      reporter_id: 'student@campus.edu',
      reporter_name: 'Aarav Sharma',
      reporter_email: 'student@campus.edu',
    },
  ],
};

function getProfileForEmail(email, isAdmin = false) {
  const clean = String(email || '').toLowerCase().trim();
  let role = 'student';
  let dept = 'Computer Science & Engineering';
  let name = 'Aarav Sharma';

  if (isAdmin || clean.includes('admin')) {
    role = 'admin';
    name = 'System Administrator';
    dept = 'Campus Operations Admin';
  } else if (clean.includes('maintenance') || clean.includes('staff')) {
    role = 'office_staff';
    dept = 'Campus Maintenance';
    name = 'Rajesh Kumar (Chief Maintenance)';
  } else if (clean.includes('faculty') || clean.includes('prof') || clean.includes('dr')) {
    role = 'faculty';
    dept = 'Department of Electrical Engineering';
    name = 'Dr. K. Raman (Faculty)';
  }

  return {
    email_id: clean || 'student@campus.edu',
    name,
    role,
    dept,
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(buffer.toString('utf8')));
        } catch (err) {
          reject(err);
        }
      } else if (contentType.includes('multipart/form-data')) {
        // Robust multipart binary parser for form fields and image attachments
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]).trim() : null;
        const result = {};

        if (boundary) {
          const boundaryBuf = Buffer.from(`--${boundary}`);
          let searchPos = 0;

          while (true) {
            const startIdx = buffer.indexOf(boundaryBuf, searchPos);
            if (startIdx === -1) break;

            const nextIdx = buffer.indexOf(boundaryBuf, startIdx + boundaryBuf.length);
            if (nextIdx === -1) break;

            const part = buffer.subarray(startIdx + boundaryBuf.length, nextIdx);
            searchPos = nextIdx;

            const sep = Buffer.from('\r\n\r\n');
            const sepIdx = part.indexOf(sep);
            if (sepIdx === -1) continue;

            const headerStr = part.subarray(0, sepIdx).toString('utf8');
            let content = part.subarray(sepIdx + 4);

            // Strip trailing \r\n before next boundary
            if (content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a) {
              content = content.subarray(0, content.length - 2);
            }

            const nameMatch = headerStr.match(/name="([^"]+)"/);
            if (!nameMatch) continue;
            const fieldName = nameMatch[1];

            const filenameMatch = headerStr.match(/filename="([^"]*)"/);
            if (filenameMatch && filenameMatch[1]) {
              const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
              const mime = ctMatch ? ctMatch[1].trim() : 'image/jpeg';
              if (content.length > 0) {
                // Store as self-contained base64 data URI for reliable, cross-origin rendering
                result[fieldName] = `data:${mime};base64,${content.toString('base64')}`;
              }
            } else {
              result[fieldName] = content.toString('utf8').trim();
            }
          }
        }
        resolve(result);
      } else {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8000'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // 1. POST /api/v1/auth/login
    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = body.email_id || 'student@campus.edu';
      if (email.toLowerCase().includes('admin')) {
        return sendJson(res, 400, {
          error: { code: 'USE_ADMIN_LOGIN', message: 'Administrator accounts must authenticate via /auth/admin/login.' },
        });
      }
      const profile = getProfileForEmail(email, false);
      return sendJson(res, 200, {
        access_token: `jwt_${crypto.randomBytes(16).toString('hex')}`,
        token_type: 'bearer',
        expires_in: 43200,
        profile,
      });
    }

    // 2. POST /api/v1/auth/admin/login
    if (pathname === '/api/v1/auth/admin/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = body.email_id || 'admin@campus.edu';
      const profile = getProfileForEmail(email, true);
      return sendJson(res, 200, {
        access_token: `admin_jwt_${crypto.randomBytes(16).toString('hex')}`,
        token_type: 'bearer',
        expires_in: 43200,
        profile,
      });
    }

    // 3. GET /api/v1/users/me
    if (pathname === '/api/v1/users/me' && method === 'GET') {
      const authHeader = req.headers['authorization'] || '';
      const isAdmin = authHeader.includes('admin');
      const profile = getProfileForEmail(isAdmin ? 'admin@campus.edu' : 'student@campus.edu', isAdmin);
      return sendJson(res, 200, profile);
    }

    // 4. GET & POST /api/v1/fixit/issue-types
    if (pathname === '/api/v1/fixit/issue-types') {
      if (method === 'GET') {
        return sendJson(res, 200, { items: db.issueTypes, count: db.issueTypes.length });
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        const newType = {
          id: `it_${Date.now()}`,
          name: body.name || 'New Category',
          description: body.description || '',
          active: true,
          created_at: new Date().toISOString(),
        };
        db.issueTypes.unshift(newType);
        return sendJson(res, 201, newType);
      }
    }

    // PATCH & DELETE /api/v1/fixit/issue-types/:id
    const typeMatch = pathname.match(/^\/api\/v1\/fixit\/issue-types\/(.+)$/);
    if (typeMatch) {
      const id = decodeURIComponent(typeMatch[1]);
      const idx = db.issueTypes.findIndex((t) => t.id === id);
      if (idx === -1) {
        return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Category not found.' } });
      }
      if (method === 'PATCH') {
        const body = await parseBody(req);
        db.issueTypes[idx] = { ...db.issueTypes[idx], ...body, updated_at: new Date().toISOString() };
        return sendJson(res, 200, db.issueTypes[idx]);
      }
      if (method === 'DELETE') {
        db.issueTypes.splice(idx, 1);
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        });
        return res.end();
      }
    }

    // 5. GET & POST /api/v1/fixit/tickets
    if (pathname === '/api/v1/fixit/tickets') {
      if (method === 'GET') {
        let results = [...db.tickets];
        const status = parsedUrl.searchParams.get('status');
        const overdue = parsedUrl.searchParams.get('overdue');
        const search = parsedUrl.searchParams.get('search');

        if (status && status !== 'all') {
          results = results.filter((t) => t.status === status);
        }
        if (overdue === 'true') {
          results = results.filter((t) => t.overdue);
        }
        if (search) {
          const q = search.toLowerCase();
          results = results.filter(
            (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.includes(q)
          );
        }

        const limit = Number(parsedUrl.searchParams.get('limit')) || 25;
        const cursor = Number(parsedUrl.searchParams.get('cursor')) || 0;
        const pageItems = results.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < results.length ? String(cursor + limit) : null;

        return sendJson(res, 200, {
          items: pageItems,
          count: results.length,
          next_cursor: nextCursor,
        });
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const category = db.issueTypes.find((t) => t.id === body.issue_type_id) || db.issueTypes[0];
        const newTicket = {
          id: `tkt_${crypto.randomBytes(3).toString('hex')}`,
          title: body.title || 'Reported Issue',
          description: body.description || '',
          issue_type_id: body.issue_type_id || db.issueTypes[0].id,
          issue_type: category,
          status: 'open',
          photo_url: body.photo || body.photo_url || null,
          created_at: new Date().toISOString(),
          expected_by: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0],
          overdue: false,
          reporter_id: 'student@campus.edu',
          reporter_name: 'Aarav Sharma',
          reporter_email: 'student@campus.edu',
        };
        db.tickets.unshift(newTicket);
        return sendJson(res, 201, newTicket);
      }
    }

    // 6. PUT /api/v1/fixit/tickets/:id/status
    const statusMatch = pathname.match(/^\/api\/v1\/fixit\/tickets\/([^/]+)\/status$/);
    if (statusMatch && method === 'PUT') {
      const id = decodeURIComponent(statusMatch[1]);
      const idx = db.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

      const body = await parseBody(req);
      db.tickets[idx].status = body.status;
      db.tickets[idx].maintenance_note = body.note;
      db.tickets[idx].updated_at = new Date().toISOString();
      if (body.status === 'resolved') {
        db.tickets[idx].resolved_at = new Date().toISOString();
      }
      return sendJson(res, 200, db.tickets[idx]);
    }

    // 7. POST /api/v1/fixit/tickets/:id/acknowledge
    const ackMatch = pathname.match(/^\/api\/v1\/fixit\/tickets\/([^/]+)\/acknowledge$/);
    if (ackMatch && method === 'POST') {
      const id = decodeURIComponent(ackMatch[1]);
      const idx = db.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

      db.tickets[idx].status = 'acknowledged';
      db.tickets[idx].acknowledged_at = new Date().toISOString();
      db.tickets[idx].updated_at = new Date().toISOString();
      return sendJson(res, 200, db.tickets[idx]);
    }

    // 8. PUT /api/v1/fixit/tickets/:id/tat
    const tatMatch = pathname.match(/^\/api\/v1\/fixit\/tickets\/([^/]+)\/tat$/);
    if (tatMatch && method === 'PUT') {
      const id = decodeURIComponent(tatMatch[1]);
      const idx = db.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

      const body = await parseBody(req);
      db.tickets[idx].expected_by = body.expected_by;
      if (body.note) db.tickets[idx].maintenance_note = body.note;
      db.tickets[idx].updated_at = new Date().toISOString();
      return sendJson(res, 200, db.tickets[idx]);
    }

    // 9. GET, PATCH, DELETE /api/v1/fixit/tickets/:id
    const ticketMatch = pathname.match(/^\/api\/v1\/fixit\/tickets\/([^/]+)$/);
    if (ticketMatch) {
      const id = decodeURIComponent(ticketMatch[1]);
      const idx = db.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

      if (method === 'GET') {
        return sendJson(res, 200, db.tickets[idx]);
      }
      if (method === 'PATCH') {
        const body = await parseBody(req);
        if (body.remove_photo === 'true' || body.remove_photo === true) {
          body.photo_url = null;
        } else if (body.photo) {
          body.photo_url = body.photo;
        }
        if (body.issue_type_id) {
          const cat = db.issueTypes.find((t) => t.id === body.issue_type_id);
          if (cat) body.issue_type = cat;
        }
        db.tickets[idx] = { ...db.tickets[idx], ...body, updated_at: new Date().toISOString() };
        return sendJson(res, 200, db.tickets[idx]);
      }
      if (method === 'DELETE') {
        db.tickets.splice(idx, 1);
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        });
        return res.end();
      }
    }

    // 404 Not Found
    return sendJson(res, 404, {
      error: { code: 'NOT_FOUND', message: `No route for ${method} ${pathname}` },
    });
  } catch (err) {
    return sendJson(res, 500, {
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' },
    });
  }
});

server.listen(PORT, () => {
  console.log(`[CampusOS Backend] Running at http://localhost:${PORT}`);
  console.log(`[CampusOS Backend] Endpoints:`);
  console.log(`  - POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`  - POST http://localhost:${PORT}/api/v1/auth/admin/login`);
  console.log(`  - GET  http://localhost:${PORT}/api/v1/users/me`);
  console.log(`  - GET  http://localhost:${PORT}/api/v1/fixit/tickets`);
  console.log(`  - GET  http://localhost:${PORT}/api/v1/fixit/issue-types`);
});
