#!/usr/bin/env sh

echo "⚙️ Building vditor in $(pwd)..."
echo ""

rm -rf /dist
echo "✅ Clean old dist files successfully."
rm -rf /node_modules
echo "✅ Remove node_modules successfully."
pnpm install
echo "✅ Install dependencies successfully."
pnpm run build
echo ""
echo "🚀 Build VDITOR successfully."
echo ""
