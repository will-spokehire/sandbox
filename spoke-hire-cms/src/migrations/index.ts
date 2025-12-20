import * as migration_20251215_193332 from './20251215_193332';
import * as migration_20251216_120216 from './20251216_120216';
import * as migration_20251219_155603 from './20251219_155603';
import * as migration_20251220_184954 from './20251220_184954';
import * as migration_20251220_190402 from './20251220_190402';
import * as migration_20251220_190613 from './20251220_190613';

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
  {
    up: migration_20251220_184954.up,
    down: migration_20251220_184954.down,
    name: '20251220_184954'
  },
  {
    up: migration_20251220_190402.up,
    down: migration_20251220_190402.down,
    name: '20251220_190402'
  },
  {
    up: migration_20251220_190613.up,
    down: migration_20251220_190613.down,
    name: '20251220_190613'
  },
];
