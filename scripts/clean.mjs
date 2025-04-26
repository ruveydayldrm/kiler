// OneDrive gibi senkronize klasörlerde görülen ".next readlink EINVAL" hatası için .next klasörünü siler.
import { rmSync } from "node:fs";

rmSync(".next", { recursive: true, force: true });
console.log("✓ .next klasörü silindi.");
