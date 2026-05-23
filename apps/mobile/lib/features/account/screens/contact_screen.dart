import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
    return BrandScaffold(
      title: 'Contact us',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            settingsSection(context, 'Get in touch'),
            BrandCard(
              child: Column(children: [
                settingsTile(context, Icons.mail_outline, 'Email support',
                    subtitle: _supportEmail,
                    onTap: () => _open(Uri(
                          scheme: 'mailto',
                          path: _supportEmail,
                          query: 'subject=Smart Advisor — support',
                        ))),
                settingsTile(context, Icons.bug_report_outlined,
                    'Report a bug',
                    subtitle: 'Open a GitHub issue',
                    onTap: () => _open(Uri.parse(_issuesUrl))),
                settingsTile(context, Icons.code_outlined, 'View the source',
                    subtitle: 'Smart Advisor is open source',
                    onTap: () => _open(Uri.parse(_repoUrl))),
              ]),
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Subtitle(
                  'We read every message — please mention which version '
                  'you\'re running and what you were doing when something '
                  'went wrong.'),
            ),
          ],
        ),
      ),
    );
  }
}
