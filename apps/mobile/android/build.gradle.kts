allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)

    // Pin every plugin's Java + Kotlin compile target to 17 so older
    // plugins (e.g. receive_sharing_intent ships a Kotlin 21 build
    // against Java 1.8) don't fail with "Inconsistent JVM-target
    // compatibility" during assembleRelease. The app module already
    // requests 17 in its own compileOptions/kotlinOptions; this just
    // makes sure every transitive plugin agrees. Must be registered
    // BEFORE the next subprojects block (which calls
    // evaluationDependsOn(":app") and forces evaluation to complete) —
    // afterEvaluate can't attach to an already-evaluated project.
    afterEvaluate {
        (project.extensions.findByName("android")
            as? com.android.build.gradle.BaseExtension)?.apply {
            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
        tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>()
            .configureEach {
                compilerOptions {
                    jvmTarget.set(
                        org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
                }
            }
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
