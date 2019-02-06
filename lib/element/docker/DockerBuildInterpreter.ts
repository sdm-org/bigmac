/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { projectUtils } from "@atomist/automation-client";
import {
    goals,
    isMaterialChange,
    LogSuppressor,
} from "@atomist/sdm";
import {
    Interpretation,
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import {
    DockerBuild,
    DockerProgressReporter,
} from "@atomist/sdm-pack-docker";
import { DockerStack } from "./dockerScanner";

export class DockerBuildInterpreter implements Interpreter {

    private readonly dockerBuildGoal: DockerBuild = new DockerBuild()
        .with({
            progressReporter: DockerProgressReporter,
            logInterpreter: LogSuppressor,
            options: {
                builder: "kaniko",
                dockerfileFinder: async p => {
                    let dockerfile: string = "Dockerfile";
                    await projectUtils.doWithFiles(p, "**/Dockerfile", async f => {
                        dockerfile = f.path;
                    });
                    return dockerfile;
                },
            },
        });

    public async enrich(interpretation: Interpretation): Promise<boolean> {

        const dockerStack = interpretation.reason.analysis.elements.docker as DockerStack;
        if (!dockerStack) {
            return false;
        }

        interpretation.containerBuildGoals = goals("docker build").plan(this.dockerBuildGoal);

        interpretation.materialChangePushTests.push(isMaterialChange({
            files: ["Dockerfile"],
        }));

        return true;
    }
}
