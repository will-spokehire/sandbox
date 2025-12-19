import * as migration_20251215_193332 from './20251215_193332';
import * as migration_20251216_120216 from './20251216_120216';
import * as migration_20251219_155603 from './20251219_155603';

export const migrations = [
  {
    up: migration_20251215_193332.up,
    down: migration_20251215_193332.down,
    name: '20251215_193332',
  },
  {
    up: migration_20251216_120216.up,
    down: migration_20251216_120216.down,
    name: '20251216_120216'
  },
  {
    up: migration_20251219_155603.up,
    down: migration_20251219_155603.down,
    name: '20251219_155603'
  },
];
