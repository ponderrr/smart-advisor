import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;
import 'package:smart_advisor/features/recommendations/services/deezer_service.dart';
import 'package:smart_advisor/features/recommendations/services/open_library_service.dart';

void main() {
  test('OpenLibrary builds an -L.jpg cover URL from cover_i', () async {
    final client = MockClient((req) async {
      expect(req.url.host, 'openlibrary.org');
      return http.Response(
          '{"docs":[{"title":"Piranesi","first_publish_year":2020,'
          '"cover_i":10523338}]}',
          200);
    });
    final r = await OpenLibraryService(client).searchBook('Piranesi');
    expect(r.cover, 'https://covers.openlibrary.org/b/id/10523338-L.jpg');
    expect(r.year, 2020);
  });

  test('OpenLibrary returns empty result on miss', () async {
    final client = MockClient((_) async => http.Response('{"docs":[]}', 200));
    final r = await OpenLibraryService(client).searchBook('zzz');
    expect(r.cover, isNull);
  });

  test('Deezer pulls album art + preview from first track', () async {
    final client = MockClient((req) async {
      expect(req.url.host, 'api.deezer.com');
      return http.Response(
          '{"data":[{"preview":"https://cdns/preview.mp3",'
          '"album":{"cover_big":"https://cdns/cover.jpg"}}]}',
          200);
    });
    final r = await DeezerService(client).searchAlbum('Blonde', 'Frank Ocean');
    expect(r.cover, 'https://cdns/cover.jpg');
    expect(r.previewUrl, 'https://cdns/preview.mp3');
  });

  test('Deezer tolerates errors gracefully', () async {
    final client = MockClient((_) async => http.Response('nope', 500));
    final r = await DeezerService(client).searchAlbum('x');
    expect(r.cover, isNull);
    expect(r.previewUrl, isNull);
  });
}
