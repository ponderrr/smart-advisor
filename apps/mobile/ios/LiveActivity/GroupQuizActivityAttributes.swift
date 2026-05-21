import ActivityKit
import Foundation

/// ActivityKit attributes for the group-quiz Live Activity.
///
/// IMPORTANT: this file must belong to **both** the `Runner` app target and
/// the Live Activity widget-extension target (tick both in the Xcode File
/// Inspector → Target Membership). See SETUP.md.
///
/// `attributes` are fixed for the life of the activity; `ContentState` is
/// the part that updates as the session progresses.
struct GroupQuizActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Human-readable status line, e.g. "3/8 joined · waiting to start".
        var line: String
        /// Players currently in the session.
        var players: Int
        /// Session capacity — drives the progress bar (0 = no bar).
        var maxPlayers: Int
        /// Session status: "lobby" or "in_progress".
        var status: String
    }

    /// The 6-char join code — fixed for the life of the activity.
    var code: String
}
