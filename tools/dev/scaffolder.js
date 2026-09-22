#!/usr/bin/env node
/**
 * 🏗️ Component/Model/Route Scaffolder
 * Tạo nhanh các file theo template cho dự án
 * 
 * Usage:
 *   node scaffolder.js component <Name>      - Tạo React component
 *   node scaffolder.js page <Name>            - Tạo React page
 *   node scaffolder.js model <Name>           - Tạo Sequelize model
 *   node scaffolder.js route <Name>           - Tạo Express route + controller
 *   node scaffolder.js crud <Name>            - Tạo full CRUD (model + route + controller)
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES = {
  component: (name) => `import React from 'react';

const ${name} = ({ children, className = '' }) => {
  return (
    <div className={\`${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)} \${className}\`}>
      {children}
    </div>
  );
};

export default ${name};
`,

  page: (name) => `import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const ${name} = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">${name.replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim()}</h1>
      {/* TODO: Implement ${name} */}
    </div>
  );
};

export default ${name};
`,

  model: (name) => `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ${name} = sequelize.define('${name}', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // TODO: Define fields for ${name}
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: '${name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1)}s',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ${name};
`,

  controller: (name) => `const ${name} = require('../models/${name}');

// GET all
exports.getAll = async (req, res) => {
  try {
    const items = await ${name}.findAll();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET by ID
exports.getById = async (req, res) => {
  try {
    const item = await ${name}.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create
exports.create = async (req, res) => {
  try {
    const item = await ${name}.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT update
exports.update = async (req, res) => {
  try {
    const item = await ${name}.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.update(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const item = await ${name}.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.destroy();
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
`,

  route: (name) => {
    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    return `const express = require('express');
const router = express.Router();
const ${lower}Controller = require('../controllers/${lower}.controller');
const { auth } = require('../middlewares/auth.middleware');

router.get('/', auth, ${lower}Controller.getAll);
router.get('/:id', auth, ${lower}Controller.getById);
router.post('/', auth, ${lower}Controller.create);
router.put('/:id', auth, ${lower}Controller.update);
router.delete('/:id', auth, ${lower}Controller.remove);

module.exports = router;
`;
  }
};

const PATHS = {
  component: '../client/src/components',
  page: '../client/src/pages',
  model: '../server/src/models',
  controller: '../server/src/controllers',
  route: '../server/src/routes',
};

function scaffold(type, name) {
  if (!TEMPLATES[type]) {
    console.error(\`❌ Unknown type: \${type}\`);
    console.log('Available: component, page, model, route, crud');
    process.exit(1);
  }

  const content = TEMPLATES[type](name);
  const dir = path.resolve(__dirname, PATHS[type] || '.');
  
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let filename;
  if (type === 'controller') filename = \`\${name.charAt(0).toLowerCase() + name.slice(1)}.controller.js\`;
  else if (type === 'route') filename = \`\${name.charAt(0).toLowerCase() + name.slice(1)}.routes.js\`;
  else filename = \`\${name}.jsx\`;
  if (type === 'model') filename = \`\${name}.js\`;

  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, content);
  console.log(\`✅ Created \${type}: \${filepath}\`);
}

// Parse args
const [,, type, name] = process.argv;

if (!type || !name) {
  console.log('Usage: node scaffolder.js <type> <Name>');
  console.log('Types: component, page, model, route, crud');
  process.exit(1);
}

if (type === 'crud') {
  scaffold('model', name);
  scaffold('controller', name);
  scaffold('route', name);
  console.log(\`\\n🎉 Full CRUD scaffolded for \${name}!\`);
} else {
  scaffold(type, name);
}
