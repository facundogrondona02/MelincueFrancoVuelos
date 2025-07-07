cat > start.sh << 'EOF'
#!/bin/sh

echo "🚀 Instalando dependencias..."
npm install

echo "⚙️ Compilando proyecto..."
npm run build

echo "▶️ Iniciando la app..."
npm start
EOF