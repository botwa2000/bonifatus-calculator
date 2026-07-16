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

# Suppress missing optional MLKit language models (Chinese, Devanagari, Korean, Japanese)
# The text_recognition plugin references these at runtime but only the Latin model is bundled
-dontwarn com.google.mlkit.vision.text.chinese.**
-dontwarn com.google.mlkit.vision.text.devanagari.**
-dontwarn com.google.mlkit.vision.text.korean.**
-dontwarn com.google.mlkit.vision.text.japanese.**
