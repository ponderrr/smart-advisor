/// Mirrors the web services' `{ data, error }` return convention so the
/// porting stays faithful and call sites read the same way.
class ServiceResult<T> {
  const ServiceResult({this.data, this.error});

  final T? data;
  final String? error;

  bool get isError => error != null;

  factory ServiceResult.ok(T data) => ServiceResult<T>(data: data);
  factory ServiceResult.fail(String error) => ServiceResult<T>(error: error);
}
