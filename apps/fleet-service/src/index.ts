import { Elysia } from "elysia";
import { readFileSync, rmSync, statSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { promisify } from "node:util";
import { exec as callbackExec } from "node:child_process";
import { s3Client } from "./s3";
import dotenv from "dotenv";
dotenv.config();

const execAsync = promisify(callbackExec);

const router = new Elysia().post(
  "/generate-agent-file",
  async ({
    body,
  }: {
    body: { organizationId: string; fleetUrl: string; enrollSecret: string };
  }) => {
    let workDir = "";

    try {
      const { organizationId, fleetUrl, enrollSecret } = body;

      if (!organizationId || !fleetUrl || !enrollSecret) {
        throw new Error("Missing required parameters");
      }

      workDir = mkdtempSync(path.join(tmpdir(), `pkg-${organizationId}-`));

      console.info(`Building .pkg in ${workDir}`);

      const commandMac = `npx fleetctl package \
--type=pkg \
--fleet-url ${fleetUrl} \
--enable-scripts \
--fleet-desktop \
--verbose \
--enroll-secret "${enrollSecret}"`;

      console.info(`Executing; command: ${commandMac}`);

      await execAsync(commandMac, {
        cwd: workDir,
      });

      const pkgPath = path.join(workDir, "fleet-osquery.pkg");

      console.info(`Created fleet-osquery.pkg in ${pkgPath}`);

      const { size } = statSync(pkgPath);

      const s3KeyPkg = `${organizationId}/macos/fleet-osquery.pkg`;

      // Using a hardcoded bucket name for now. Consider moving to an environment variable.
      const bucketName = "compai-fleet-packages";
      console.log("Bucket name:", bucketName);

      const fileBuffer = readFileSync(pkgPath);

      // Upload the zip to S3
      const putObjectCommandPkg = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3KeyPkg,
        Body: fileBuffer,
        ContentLength: size,
        ContentType: "application/octet-stream",
      });

      console.info(`Uploading fleet-osquery.pkg to S3: ${s3KeyPkg}`);
      try {
        await s3Client.send(putObjectCommandPkg);
      } catch (error) {
        console.error(
          "Error uploading fleet-osquery.pkg to S3:",
          JSON.stringify(error, null, 2)
        );
        throw error;
      }

      const s3Region = await s3Client.config.region();
      const s3ObjectUrlPkg = `https://${bucketName}.s3.${s3Region}.amazonaws.com/${s3KeyPkg}`;

      console.info("S3 Upload successful.", {
        fileUrlPkg: s3ObjectUrlPkg,
      });

      return {
        fileUrlPkg: s3ObjectUrlPkg,
      };
    } catch (error) {
      console.error("Error generating agent file:", error);
      throw error;
    } finally {
      if (workDir) {
        try {
          rmSync(workDir, { recursive: true });
        } catch (cleanupError) {
          console.error("Error cleaning up temporary directory:", cleanupError);
        }
      }
    }
  }
);

const app = new Elysia().use(router).listen(3004);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
