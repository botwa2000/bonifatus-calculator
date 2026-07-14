# Flutter default ProGuard rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Suppress warnings for Play Core classes referenced by Flutter's split-install embedding
# These are unused in standard (non-split) release builds
-dontwarn com.google.android.play.core.**

# Google ML Kit — text recognition
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_text_latin.** { *; }
