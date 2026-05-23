import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import 'settings_helpers.dart';

/// Contact / support options. Email is the primary channel (matches the
/// landing page footer at src/app/page.tsx); GitHub Issues for bugs +
/// feature requests since the project is open source.
const _supportEmail = 'support@smartadvisor.live';
const _issuesUrl = 'https://github.com/ponderrr/smart-advisor/issues';
const _repoUrl = 'https://github.com/ponderrr/smart-advisor';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  Future<void> _open(Uri uri) =>
      launchUrl(uri, mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BrandScaffold(
      title: l.contactTitle,
      body: ResponsiveCenter(
        maxWidth: 760,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            settingsSection(context, l.contactSectionGetInTouch),
            BrandCard(
              child: Column(children: [
                settingsTile(context, Icons.mail_outline, l.contactEmailSupport,
                    subtitle: _supportEmail,
                    onTap: () => _open(Uri(
                          scheme: 'mailto',
                          path: _supportEmail,
                          query: 'subject=${l.contactEmailSubject}',
                        ))),
                settingsTile(context, Icons.bug_report_outlined,
                    l.contactReportBug,
                    subtitle: l.contactReportBugSubtitle,
                    onTap: () => _open(Uri.parse(_issuesUrl))),
                settingsTile(context, Icons.code_outlined, l.contactViewSource,
                    subtitle: l.contactViewSourceSubtitle,
                    onTap: () => _open(Uri.parse(_repoUrl))),
              ]),
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Subtitle(l.contactFooterNote),
            ),
          ],
        ),
      ),
    );
  }
}
