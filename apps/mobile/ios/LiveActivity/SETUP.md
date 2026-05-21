# iOS Live Activity — Xcode setup

The group-quiz **Live Activity** (Dynamic Island + lock screen) needs a
native widget extension that can only be created and built in Xcode on a
Mac. This folder has the finished Swift UI — these steps wire it into the
iOS project and connect it to the Flutter side.

Until this is done, the group-quiz live status still works cross-platform:
Android shows an ongoing Live-Update notification, and iOS shows a normal
notification (see `NotificationService.showGroupQuizLive` in
`lib/features/notifications/notification_service.dart`).

## 1. Create the widget-extension target

1. Open `ios/Runner.xcworkspace` in Xcode.
2. **File → New → Target… → Widget Extension**. Name it `GroupQuizWidget`.
   - Untick "Include Configuration App Intent".
   - Tick "Include Live Activity".
   - Embed it in `Runner`.
3. Delete the placeholder `.swift` files Xcode generated inside the new
   `GroupQuizWidget` group (keep `Assets.xcassets` and `Info.plist`).

## 2. Add the Swift files

1. Drag `GroupQuizActivityAttributes.swift` and `GroupQuizLiveActivity.swift`
   (this folder) into the `GroupQuizWidget` group in Xcode.
2. Target membership (File Inspector, right pane):
   - `GroupQuizLiveActivity.swift` → **GroupQuizWidget only**.
   - `GroupQuizActivityAttributes.swift` → **both Runner and GroupQuizWidget**
     (the app and the widget share this type).

## 3. Enable Live Activities + an App Group

1. Select the **Runner** target → Info → add a boolean key
   `NSSupportsLiveActivities` = `YES`.
2. Add the **App Groups** capability to **both** the `Runner` and
   `GroupQuizWidget` targets, using the same group id, e.g.
   `group.live.smartadvisor.smart_advisor`.

## 4. Add the Flutter bridge package

In `apps/mobile/pubspec.yaml` add:

```yaml
  live_activities: ^2.5.0   # check pub.dev for the current version
```

then `flutter pub get`.

## 5. Wire the Dart side

In `lib/features/notifications/notification_service.dart`, give
`showGroupQuizLive` / `cancelGroupQuizLive` an iOS branch. Sketch:

```dart
import 'dart:io';
import 'package:live_activities/live_activities.dart';

static final _liveActivities = LiveActivities();
static String? _groupQuizActivityId;

// once, in init():
//   await _liveActivities.init(appGroupId: 'group.live.smartadvisor.smart_advisor');

// inside showGroupQuizLive(), before the flutter_local_notifications call:
if (Platform.isIOS) {
  final data = {
    'code': code,
    'line': line,
    'players': progress ?? 0,
    'maxPlayers': maxProgress ?? 0,
    'status': progress == null ? 'in_progress' : 'lobby',
  };
  if (_groupQuizActivityId == null) {
    _groupQuizActivityId = await _liveActivities.createActivity(data);
  } else {
    await _liveActivities.updateActivity(_groupQuizActivityId!, data);
  }
  return; // skip the local-notification fallback on iOS
}

// inside cancelGroupQuizLive():
if (Platform.isIOS && _groupQuizActivityId != null) {
  await _liveActivities.endActivity(_groupQuizActivityId!);
  _groupQuizActivityId = null;
  return;
}
```

The `data` map keys must match `GroupQuizActivityAttributes.ContentState`
(`line`, `players`, `maxPlayers`, `status`) and `code`.

## 6. Build & verify

`flutter build ios` (or run on a device — Live Activities don't show in the
simulator's Dynamic Island reliably; test on an iPhone 14 Pro or newer).
Start a group quiz and confirm the activity appears on the lock screen and
in the Dynamic Island, and ends when the session completes or you leave.
