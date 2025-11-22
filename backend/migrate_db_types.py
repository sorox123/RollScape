"""
Migrate models from PostgreSQL-specific types to cross-compatible types.
Converts UUID → GUID and JSONB → FlexJSON for SQLite compatibility.
"""

import os
import re
from pathlib import Path

def migrate_model_file(file_path):
    """Update a single model file to use cross-compatible types"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changed = False
    
    # 1. Update imports - remove PostgreSQL-specific imports
    if 'from sqlalchemy.dialects.postgresql import' in content:
        # Remove UUID, JSONB from postgresql imports
        content = re.sub(
            r'from sqlalchemy\.dialects\.postgresql import ([^\n]+)',
            lambda m: handle_pg_imports(m.group(1)),
            content
        )
        changed = True
    
    # 2. Add db_types import if not present
    if 'from db_types import' not in content and ('UUID(' in content or 'JSONB' in content):
        # Find where to insert the import (after other imports)
        import_section = re.search(r'(from database import Base.*?\n)', content)
        if import_section:
            insert_pos = import_section.end()
            content = content[:insert_pos] + 'from db_types import GUID, FlexJSON\n' + content[insert_pos:]
            changed = True
    
    # 3. Replace UUID(as_uuid=True) with GUID()
    if 'UUID(as_uuid=True)' in content:
        content = content.replace('UUID(as_uuid=True)', 'GUID()')
        changed = True
    
    # 4. Replace Column(UUID with Column(GUID
    if 'Column(UUID(' in content:
        content = re.sub(r'Column\(UUID\([^)]*\)', 'Column(GUID()', content)
        changed = True
    
    # 5. Replace JSONB with FlexJSON
    if 'Column(JSONB' in content or ', JSONB' in content:
        content = content.replace('Column(JSONB,', 'Column(FlexJSON,')
        content = content.replace('Column(JSONB)', 'Column(FlexJSON)')
        content = content.replace(', JSONB', ', FlexJSON')
        changed = True
    
    # 6. Clean up any leftover UUID imports that weren't caught
    content = re.sub(r'from sqlalchemy\.dialects\.postgresql import\s*\n', '', content)
    
    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def handle_pg_imports(import_line):
    """Remove UUID and JSONB from postgresql imports, keep others if any"""
    imports = [i.strip() for i in import_line.split(',')]
    # Filter out UUID and JSONB
    remaining = [i for i in imports if i not in ['UUID', 'JSONB']]
    
    if remaining:
        return f'from sqlalchemy.dialects.postgresql import {", ".join(remaining)}'
    else:
        # No imports left, remove the whole line
        return ''


def migrate_all_models():
    """Migrate all model files in the models directory"""
    models_dir = Path(__file__).parent / 'models'
    
    print("🔄 Migrating models to cross-compatible types...\n")
    
    migrated = []
    skipped = []
    
    for model_file in models_dir.glob('*.py'):
        if model_file.name == '__init__.py':
            continue
        
        print(f"Checking {model_file.name}...")
        if migrate_model_file(model_file):
            migrated.append(model_file.name)
            print(f"  ✅ Migrated")
        else:
            skipped.append(model_file.name)
            print(f"  ⏭️  No changes needed")
    
    print(f"\n{'='*60}")
    print(f"✅ Migration Complete!")
    print(f"{'='*60}")
    print(f"Migrated: {len(migrated)} files")
    print(f"Skipped: {len(skipped)} files")
    
    if migrated:
        print(f"\nMigrated files:")
        for f in migrated:
            print(f"  - {f}")
    
    print(f"\n📝 Next steps:")
    print(f"  1. Review changes: git diff")
    print(f"  2. Run: python init_db.py")
    print(f"  3. Test: python test_auth.py")


if __name__ == "__main__":
    migrate_all_models()
