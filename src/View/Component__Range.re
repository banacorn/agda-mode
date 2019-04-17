let component = ReasonReact.statelessComponent("Range");

open Type.Location;

module Link = Component__Link;

let make = (~range, ~abbr=false, _children) => {
  ...component,
  render: _self =>
    if (abbr) {
      <Link jump=true target={Range.RangeLink(range)}>
        <span className="text-subtle range icon icon-link" />
      </Link>;
    } else {
      <Link jump=true target={Range.RangeLink(range)}>
        <span className="text-subtle range icon icon-link">
          {ReasonReact.string(Range.toString(range))}
        </span>
      </Link>;
    },
};
