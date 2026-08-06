using NetTopologySuite;
using NetTopologySuite.Geometries;

namespace MajstorHub.Api.Common;

public static class GeoHelper
{
    private const int Srid = 4326;
    private static readonly GeometryFactory Factory = NtsGeometryServices.Instance.CreateGeometryFactory(Srid);

    public static Point CreatePoint(double latitude, double longitude)
    {
        return Factory.CreatePoint(new Coordinate(longitude, latitude));
    }
}
