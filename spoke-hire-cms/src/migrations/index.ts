import * as migration_20260103_161621 from './20260103_161621';
import * as migration_20260104_162229 from './20260104_162229';
import * as migration_20260109_103301 from './20260109_103301';
import * as migration_20260124_175548 from './20260124_175548';

export const migrations = [
  {
    up: migration_20260103_161621.up,
    down: migration_20260103_161621.down,
    name: '20260103_161621',
  },
  {
    up: migration_20260104_162229.up,
    down: migration_20260104_162229.down,
    name: '20260104_162229',
  },
  {
    up: migration_20260109_103301.up,
    down: migration_20260109_103301.down,
    name: '20260109_103301',
  },
  {
    up: migration_20260124_175548.up,
    down: migration_20260124_175548.down,
    name: '20260124_175548'
  },
];
