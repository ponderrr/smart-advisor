package live.smartadvisor.smart_advisor.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider
import live.smartadvisor.smart_advisor.MainActivity
import live.smartadvisor.smart_advisor.R

/**
 * Home-screen widget showing the most recent friend post + a tap target
 * that launches the app. Data lands here via the home_widget plugin —
 * Dart calls HomeWidget.saveWidgetData("latest_pick_title", …) and
 * HomeWidget.updateWidget(...), which fires onUpdate below.
 *
 * Layout is a 2x1 cell. Keep the strings short — RemoteViews can't
 * auto-shrink and clipping is ugly.
 */
class LatestPickWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { id ->
            val views = RemoteViews(context.packageName, R.layout.latest_pick_widget).apply {
                val title = widgetData.getString("latest_pick_title", null)
                    ?: "Smart Advisor"
                val subtitle = widgetData.getString("latest_pick_subtitle", null)
                    ?: "Tap to open"
                setTextViewText(R.id.widget_title, title)
                setTextViewText(R.id.widget_subtitle, subtitle)

                // Tap anywhere on the cell launches the app at /.
                val pendingIntent = HomeWidgetLaunchIntent.getActivity(
                    context, MainActivity::class.java
                )
                setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            }
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}
