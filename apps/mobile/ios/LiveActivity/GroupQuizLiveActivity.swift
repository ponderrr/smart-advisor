import ActivityKit
import SwiftUI
import WidgetKit

/// The group-quiz Live Activity — lock-screen banner + Dynamic Island.
///
/// This file belongs to the **widget-extension target only**. It is the
/// `@main` entry point for that extension. See SETUP.md.
@available(iOS 16.1, *)
struct GroupQuizLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GroupQuizActivityAttributes.self) { context in
            // Lock screen / Notification Center presentation.
            GroupQuizLockScreenView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Group quiz", systemImage: "person.3.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.attributes.code)
                        .font(.caption.monospaced().bold())
                        .foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.state.line)
                            .font(.subheadline.weight(.semibold))
                        if context.state.maxPlayers > 0 {
                            ProgressView(
                                value: Double(context.state.players),
                                total: Double(context.state.maxPlayers))
                                .tint(.indigo)
                        }
                    }
                }
            } compactLeading: {
                Image(systemName: "person.3.fill")
            } compactTrailing: {
                Text("\(context.state.players)")
                    .font(.caption.bold())
            } minimal: {
                Image(systemName: "person.3.fill")
            }
        }
    }
}

/// Lock-screen / banner view for the Live Activity.
@available(iOS 16.1, *)
struct GroupQuizLockScreenView: View {
    let context: ActivityViewContext<GroupQuizActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Group quiz", systemImage: "person.3.fill")
                    .font(.caption.weight(.bold))
                Spacer()
                Text(context.attributes.code)
                    .font(.caption.monospaced().bold())
                    .foregroundStyle(.secondary)
            }
            Text(context.state.line)
                .font(.headline)
            if context.state.maxPlayers > 0 {
                ProgressView(
                    value: Double(context.state.players),
                    total: Double(context.state.maxPlayers))
                    .tint(.indigo)
            }
        }
        .padding()
    }
}

/// `@main` bundle for the widget extension.
@available(iOS 16.1, *)
@main
struct GroupQuizWidgetBundle: WidgetBundle {
    var body: some Widget {
        GroupQuizLiveActivity()
    }
}
